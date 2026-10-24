import { describe, expect, it } from "vitest";
import raw from "@/fixtures/programs.v2.json";
import { fixtureResult, parseFixture, programIds } from "@/lib/data/programs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clone = () => structuredClone(raw) as any;
const codes = (input: unknown) => {
  const r = parseFixture(input);
  return r.ok ? [] : r.errors;
};

const markSourcesUnreviewed = (fixture: ReturnType<typeof clone>) => {
  for (const source of fixture.sources) {
    source.reviewStatus = "unreviewed";
    source.url = null;
    source.retrieved = null;
  }
};

describe("programs.v2.json fixture", () => {
  it("parses ok and covers exactly SNAP, RAFT, and utility protection", () => {
    expect(fixtureResult.ok).toBe(true);
    if (!fixtureResult.ok) return;
    expect(fixtureResult.value.version).toBe(2);
    expect(fixtureResult.value.programs.map((p) => p.id).sort()).toEqual([...programIds].sort());
    expect(fixtureResult.value.rules.every((r) => r.synthetic && r.deadline === null)).toBe(true);
    expect(fixtureResult.value.sources.every((s) => s.reviewStatus === "reviewed" && s.url?.startsWith("https://www.mass.gov/"))).toBe(true);
  });

  it("rejects a rule citing an unknown source, naming the rule and source", () => {
    const bad = clone();
    bad.rules[0].sourceIds = ["S-NOPE"];
    expect(codes(bad)).toContainEqual({ code: "unknown_source", ids: ["R-SNAP", "S-NOPE"] });
  });

  it("rejects synthetic:false with an unreviewed source, listing each such source", () => {
    const bad = clone();
    markSourcesUnreviewed(bad);
    bad.rules[1].synthetic = false;
    expect(codes(bad)).toContainEqual({ code: "nonsynthetic_unreviewed_source", ids: ["R-RAFT", "S-RAFT-01"] });
  });

  it("rejects an undefined evidence type", () => {
    const bad = clone();
    bad.evidenceRequirements.push({ actionId: "A-SNAP", evidenceTypeId: "E-NOPE", level: "required" });
    expect(codes(bad)).toContainEqual({ code: "unknown_evidence_type", ids: ["E-NOPE"] });
  });

  it("rejects an undefined action in an evidence requirement", () => {
    const bad = clone();
    bad.evidenceRequirements.push({ actionId: "A-NOPE", evidenceTypeId: "E-ID", level: "required" });
    expect(codes(bad)).toContainEqual({ code: "unknown_action", ids: ["A-NOPE"] });
  });

  it("rejects a repeated (evidence type, action) pair", () => {
    const bad = clone();
    bad.evidenceRequirements.push({ actionId: "A-SNAP", evidenceTypeId: "E-ID", level: "helpful" });
    expect(codes(bad)).toContainEqual({ code: "duplicate_evidence_requirement", ids: ["E-ID", "A-SNAP"] });
  });

  it("rejects bad edges (unknown endpoint and self edge)", () => {
    const bad = clone();
    bad.edges.push({ from: "A-RAFT", to: "A-NOPE", reasonKey: "edge.housing_first" });
    bad.edges.push({ from: "A-SNAP", to: "A-SNAP", reasonKey: "edge.housing_first" });
    const errs = codes(bad);
    expect(errs).toContainEqual({ code: "unknown_edge_endpoint", ids: ["A-NOPE"] });
    expect(errs).toContainEqual({ code: "self_edge", ids: ["A-SNAP"] });
  });

  it("collects every error at once and returns no partial data", () => {
    const bad = clone();
    bad.rules[0].sourceIds = ["S-NOPE"];
    bad.edges.push({ from: "A-RAFT", to: "A-NOPE", reasonKey: "x" });
    const r = parseFixture(bad);
    expect(r.ok).toBe(false);
    expect("value" in r).toBe(false);
    if (!r.ok) expect(r.errors.length).toBeGreaterThanOrEqual(2);
  });

  describe("no-numbers guard on unreviewed records (Req 4.7)", () => {
    it.each([
      ["a dollar amount", (f: ReturnType<typeof clone>) => (f.sources[0].title = "Benefit up to $ 500")],
      ["a day count", (f: ReturnType<typeof clone>) => (f.sources[1].title = "Apply within 30 days")],
      ["a Spanish day count", (f: ReturnType<typeof clone>) => (f.sources[1].publisher = "Plazo de 14 días")],
      ["a YYYY-MM-DD date", (f: ReturnType<typeof clone>) => (f.rules[2].predicates[0].id = "P-2026-01-31")],
    ])("rejects %s", (_label, mutate) => {
      const bad = clone();
      markSourcesUnreviewed(bad);
      mutate(bad);
      expect(codes(bad).map((e) => e.code)).toContain("policy_number_without_reviewed_source");
    });

    it("rejects a deadline on a rule with an unreviewed source", () => {
      const bad = clone();
      markSourcesUnreviewed(bad);
      bad.facts.push({ id: "notice_date", kind: "date" });
      bad.rules[1].deadline = { kind: "offset_from_date_fact", factId: "notice_date", offsetDays: 1 };
      expect(codes(bad).map((e) => e.code)).toContain("deadline_without_reviewed_source");
    });

    it("rejects a numeric predicate on a rule with an unreviewed source", () => {
      const bad = clone();
      markSourcesUnreviewed(bad);
      bad.rules[0].predicates.push({ id: "P-SNAP-HH", factId: "household_size", op: "equals", value: 3 });
      expect(codes(bad).map((e) => e.code)).toContain("number_without_reviewed_source");
    });

    it("passes on the real v2 fixture", () => {
      expect(codes(clone())).toEqual([]);
    });
  });

  it("rejects a predicate on the area-context neighborhood fact", () => {
    const bad = clone();
    bad.rules[0].predicates.push({ id: "P-SNAP-NB", factId: "neighborhood", op: "equals", value: "x" });
    expect(codes(bad)).toContainEqual({ code: "area_context_predicate", ids: ["R-SNAP", "neighborhood"] });
  });
});
