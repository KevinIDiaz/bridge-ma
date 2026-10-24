import { describe, expect, it } from "vitest";
import { TEXT_MAX_LENGTH, UNKNOWN, validateField, validateForm } from "@/lib/session/validation";
import type { FactDef } from "@/lib/rules/types";

const textDef: FactDef = { id: "city", kind: "text" };
const householdDef: FactDef = { id: "household_size", kind: "number", min: 1, max: 20 };
const boolDef: FactDef = { id: "lives_in_ma", kind: "boolean" };
const choiceDef: FactDef = { id: "preferred_language", kind: "choice", options: ["en", "es"] };

describe("validateField — text (≤ 200 chars)", () => {
  it("accepts exactly 200 characters", () => {
    const value = "a".repeat(TEXT_MAX_LENGTH);
    expect(validateField(textDef, value)).toEqual({ ok: true, value });
  });

  it("rejects 201 characters", () => {
    expect(validateField(textDef, "a".repeat(TEXT_MAX_LENGTH + 1))).toEqual({
      ok: false,
      code: "text_too_long",
    });
  });

  it("blank text becomes unknown", () => {
    expect(validateField(textDef, "")).toEqual({ ok: true, value: UNKNOWN });
    expect(validateField(textDef, "   ")).toEqual({ ok: true, value: UNKNOWN });
  });

  it("explicit 'I don't know' becomes unknown even with text present", () => {
    expect(validateField(textDef, "Boston", true)).toEqual({ ok: true, value: UNKNOWN });
  });
});

describe("validateField — number (household_size 1–20)", () => {
  it("rejects 0 (below min)", () => {
    expect(validateField(householdDef, "0")).toEqual({ ok: false, code: "number_out_of_range" });
  });

  it("accepts 1 (min boundary)", () => {
    expect(validateField(householdDef, "1")).toEqual({ ok: true, value: 1 });
  });

  it("accepts 20 (max boundary)", () => {
    expect(validateField(householdDef, "20")).toEqual({ ok: true, value: 20 });
  });

  it("rejects 21 (above max)", () => {
    expect(validateField(householdDef, "21")).toEqual({ ok: false, code: "number_out_of_range" });
  });

  it("rejects 2.5 as not a whole number", () => {
    expect(validateField(householdDef, "2.5")).toEqual({ ok: false, code: "number_not_whole" });
  });

  it("rejects non-numeric text", () => {
    expect(validateField(householdDef, "abc")).toEqual({ ok: false, code: "number_required" });
  });

  it("blank number becomes unknown", () => {
    expect(validateField(householdDef, "")).toEqual({ ok: true, value: UNKNOWN });
  });
});

describe("validateField — boolean and choice", () => {
  it("parses true/false and treats blank as unknown", () => {
    expect(validateField(boolDef, "true")).toEqual({ ok: true, value: true });
    expect(validateField(boolDef, "false")).toEqual({ ok: true, value: false });
    expect(validateField(boolDef, "")).toEqual({ ok: true, value: UNKNOWN });
  });

  it("accepts a valid choice option and rejects an unknown option string", () => {
    expect(validateField(choiceDef, "es")).toEqual({ ok: true, value: "es" });
    expect(validateField(choiceDef, "fr")).toEqual({ ok: false, code: "choice_invalid" });
    expect(validateField(choiceDef, "", true)).toEqual({ ok: true, value: UNKNOWN });
  });
});

describe("validateForm", () => {
  const defs: FactDef[] = [textDef, householdDef, boolDef];

  it("returns normalized values when every field is valid", () => {
    const result = validateForm(defs, { city: "Boston", household_size: "2", lives_in_ma: "true" });
    expect(result).toEqual({ ok: true, values: { city: "Boston", household_size: 2, lives_in_ma: true } });
  });

  it("collects every field error", () => {
    const result = validateForm(defs, {
      city: "x".repeat(201),
      household_size: "0",
      lives_in_ma: "true",
    });
    expect(result).toEqual({
      ok: false,
      errors: { city: "text_too_long", household_size: "number_out_of_range" },
    });
  });
});
