import { describe, expect, it } from "vitest";
import { evaluatePrograms } from "@/lib/rules/engine";
import { splitFacts } from "@/lib/rules/facts";
import { demoFacts, v2 } from "./demo-facts";

describe("evaluatePrograms", () => {
  it("demo persona before confirmation: all cant_tell, everything unconfirmed", () => {
    const f = v2();
    const r = evaluatePrograms(splitFacts(demoFacts("unconfirmed"), f.facts), f);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.map((e) => [e.programId, e.status])).toEqual([
      ["snap", "cant_tell"],
      ["raft", "cant_tell"],
      ["utility", "cant_tell"],
    ]);
    for (const e of r.value) {
      expect(e.missingFactIds).toEqual([]);
      expect(e.unconfirmedFactIds.length).toBe(e.predicateResults.length);
      expect(e.predicateResults.every((p) => p.result === "unknown")).toBe(true);
    }
  });

  it("demo persona after confirmation: SNAP and RAFT may_match, utility cant_tell missing shutoff notice", () => {
    const f = v2();
    const r = evaluatePrograms(splitFacts(demoFacts("confirmed"), f.facts), f);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const [snap, raft, util] = r.value;
    expect(snap.status).toBe("may_match");
    expect(raft.status).toBe("may_match");
    expect(util.status).toBe("cant_tell");
    expect(util.missingFactIds).toEqual(["received_shutoff_notice"]);
    expect(util.unconfirmedFactIds).toEqual([]);
    expect(raft).toMatchObject({ ruleId: "R-RAFT", ruleVersion: 1, fixtureVersion: 2, sourceIds: ["S-RAFT-01"] });
  });

  it("a confirmed false predicate gives likely_not even when another is unknown", () => {
    const f = v2();
    const facts = demoFacts("confirmed").map((x) => (x.id === "has_utility_account" ? { ...x, value: false } : x));
    const r = evaluatePrograms(splitFacts(facts, f.facts), f);
    expect(r.ok && r.value[2].status).toBe("likely_not");
  });

  it("splitFacts drops neighborhood and never copies unconfirmed values", () => {
    const f = v2();
    const facts = demoFacts("confirmed").map((x) => (x.id === "rents_home" ? { ...x, confirmation: "unconfirmed" as const } : x));
    const s = splitFacts(facts, f.facts);
    expect(Object.hasOwn(s.confirmed, "neighborhood")).toBe(false);
    expect(Object.hasOwn(s.confirmed, "rents_home")).toBe(false);
    expect(s.unconfirmedIds).toEqual(["rents_home"]);
  });

  it.each([
    ["no rule", (f: ReturnType<typeof v2>) => (f.rules = f.rules.filter((r) => r.programId !== "raft"))],
    ["two rules", (f: ReturnType<typeof v2>) => f.rules.push({ ...f.rules[1], id: "R-RAFT-2" })],
    ["zero predicates", (f: ReturnType<typeof v2>) => (f.rules[1].predicates = [])],
  ])("returns a rule_count error and no evaluations for %s", (_label, mutate) => {
    const f = v2();
    mutate(f);
    const r = evaluatePrograms(splitFacts(demoFacts("confirmed"), f.facts), f);
    expect(r).toEqual({ ok: false, errors: [{ kind: "rule_count", programId: "raft" }] });
  });
});
