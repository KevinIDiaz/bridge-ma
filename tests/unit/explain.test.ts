import { afterEach, describe, expect, it, vi } from "vitest";
import { demoAdapter, getModelAdapter } from "@/lib/model/adapter";
import { explainWithFallback } from "@/lib/model/explain";
import { explainTemplate } from "@/lib/model/templates";
import type { ExplainInput } from "@/lib/model/adapter";

// Test-only fake dictionary. Real keys are added to src/lib/i18n by task 2.19.
const fakeDict = { explain: { raft: { may_match: "Fictional template: RAFT may match." } } };
const input: ExplainInput = { programId: "raft", status: "may_match", locale: "es" };

afterEach(() => vi.restoreAllMocks());

describe("explainTemplate", () => {
  it("reads explain.<programId>.<status> from the dictionary", () => {
    expect(explainTemplate(input, fakeDict)).toBe("Fictional template: RAFT may match.");
  });

  it("returns an empty string when the key is missing, never a hard-coded sentence", () => {
    expect(explainTemplate({ ...input, status: "cant_tell" }, fakeDict)).toBe("");
    expect(explainTemplate(input, {})).toBe("");
  });
});

describe("explainWithFallback with the demo adapter", () => {
  it("uses the demo adapter when no provider is configured", () => {
    expect(getModelAdapter()).toBe(demoAdapter);
    expect(demoAdapter.deterministic).toBe(true);
  });

  it("is deterministic per (program, status, locale), labeled rule_based, and makes no fetch call", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const statuses = ["may_match", "likely_not", "cant_tell"] as const;
    for (const programId of ["snap", "raft", "utility"] as const) {
      for (const status of statuses) {
        for (const locale of ["en", "es"] as const) {
          const i = { programId, status, locale };
          const a = await explainWithFallback(demoAdapter, i);
          const b = await explainWithFallback(demoAdapter, i);
          expect(b).toEqual(a);
          expect(a.origin).toBe("rule_based");
          expect(a.text).toBe(explainTemplate(i));
        }
      }
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("falls back to the template when the adapter throws", async () => {
    const throwing = { ...demoAdapter, deterministic: false, explain: async () => Promise.reject(new Error("down")) };
    expect(await explainWithFallback(throwing, input, 5000, "T")).toEqual({ text: "T", origin: "rule_based" });
  });
});
