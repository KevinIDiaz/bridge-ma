import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { evaluatePrograms } from "@/lib/rules/engine";
import { splitFacts } from "@/lib/rules/facts";
import type { ResidentFact } from "@/lib/rules/types";
import { arbFactSet, NUM_RUNS, v2Fixture } from "./arbitraries";

const fixture = v2Fixture();
const evaluate = (facts: ResidentFact[]) => {
  const r = evaluatePrograms(splitFacts(facts, fixture.facts), fixture);
  if (!r.ok) throw new Error("engine failed on the v2 fixture");
  return r.value;
};

/** Reference oracle, written independently of the engine. */
function predicateOracle(facts: ResidentFact[], factId: string, expected: unknown): boolean | "unknown" {
  const f = facts.find((x) => x.id === factId);
  if (!f || f.confirmation !== "confirmed" || f.value === "unknown") return "unknown";
  return f.value === expected;
}

describe("rules engine (property)", () => {
  // Feature: action-graph, Property 2: Status equals the Kleene reference, and unknown is never definitive
  it("Property 2: status equals the Kleene reference; unknown is never definitive", () => {
    fc.assert(
      fc.property(arbFactSet(), (facts) => {
        for (const e of evaluate(facts)) {
          const rule = fixture.rules.find((r) => r.id === e.ruleId)!;
          const oracle = rule.predicates.map((p) => predicateOracle(facts, p.factId, p.value));
          expect(e.predicateResults.map((p) => p.result)).toEqual(oracle);
          const expected = oracle.includes(false) ? "likely_not" : oracle.includes("unknown") ? "cant_tell" : "may_match";
          expect(e.status).toBe(expected);
          if (oracle.includes("unknown")) {
            expect(e.status).not.toBe("may_match");
            if (!oracle.includes(false)) expect(e.status).toBe("cant_tell");
          }
        }
      }),
      NUM_RUNS,
    );
  });

  // Feature: action-graph, Property 3: Required facts are partitioned
  it("Property 3: every required fact lands in exactly one of missing, unconfirmed, or neither", () => {
    fc.assert(
      fc.property(arbFactSet(), (facts) => {
        for (const e of evaluate(facts)) {
          const rule = fixture.rules.find((r) => r.id === e.ruleId)!;
          const required = [...new Set(rule.predicates.map((p) => p.factId))];
          for (const id of required) {
            const f = facts.find((x) => x.id === id);
            const expected =
              f?.confirmation === "unconfirmed" ? "unconfirmed" : !f || f.value === "unknown" ? "missing" : "neither";
            const inMissing = e.missingFactIds.includes(id);
            const inUnconfirmed = e.unconfirmedFactIds.includes(id);
            expect(inMissing && inUnconfirmed).toBe(false);
            expect(inMissing ? "missing" : inUnconfirmed ? "unconfirmed" : "neither").toBe(expected);
          }
          expect([...e.missingFactIds, ...e.unconfirmedFactIds].every((id) => required.includes(id))).toBe(true);
        }
      }),
      NUM_RUNS,
    );
  });
});
