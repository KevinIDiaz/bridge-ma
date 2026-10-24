import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { fixtureResult } from "@/lib/data/programs";
import { evaluateBridge } from "@/lib/rules/bridge";
import type { ResidentFact } from "@/lib/rules/types";
import { arbFactSet, NUM_RUNS } from "./arbitraries";

describe("evaluateBridge (property)", () => {
  // Display language is not an input to evaluateBridge. This checks that the resident's
  // preferred_language fact (the only language-related value it sees) cannot change matching.
  it("preferred language never changes evaluations, graph, or evidence", () => {
    const arbLang = fc.option(
      fc.record({
        value: fc.constantFrom<ResidentFact["value"]>("en", "es", "unknown"),
        confirmation: fc.constantFrom<ResidentFact["confirmation"]>("confirmed", "unconfirmed"),
      }),
      { nil: undefined },
    );
    fc.assert(
      fc.property(arbFactSet(), arbLang, arbLang, (facts, l1, l2) => {
        const rest = facts.filter((f) => f.id !== "preferred_language");
        const withLang = (l: typeof l1): ResidentFact[] => (l ? [...rest, { id: "preferred_language", ...l, origin: "user" }] : rest);
        const a = evaluateBridge({ facts: withLang(l1), fixture: fixtureResult, today: "2026-10-24" });
        const b = evaluateBridge({ facts: withLang(l2), fixture: fixtureResult, today: "2026-10-24" });
        expect(a.ok && b.ok).toBe(true);
        if (!a.ok || !b.ok) return;
        expect(b.value.evaluations).toEqual(a.value.evaluations);
        expect(b.value.graph).toEqual(a.value.graph);
        expect(b.value.evidence).toEqual(a.value.evidence);
      }),
      NUM_RUNS,
    );
  });

  it("every recommendation references an existing source and the rule version it was evaluated with", () => {
    fc.assert(
      fc.property(arbFactSet(), (facts) => {
        const r = evaluateBridge({ facts, fixture: fixtureResult, today: "2026-10-24" });
        expect(r.ok).toBe(true);
        if (!r.ok || !fixtureResult.ok) return;
        const fx = fixtureResult.value;
        for (const n of r.value.graph.nodes) {
          const rule = fx.rules.find((x) => x.id === n.ruleId)!;
          expect(r.value.handoff.ruleVersions).toContainEqual({ ruleId: rule.id, version: rule.version });
          for (const sid of n.sourceIds) expect(fx.sources.map((s) => s.id)).toContain(sid);
        }
      }),
      NUM_RUNS,
    );
  });
});
