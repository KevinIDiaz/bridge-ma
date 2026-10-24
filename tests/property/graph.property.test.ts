import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { evaluatePrograms } from "@/lib/rules/engine";
import { splitFacts } from "@/lib/rules/facts";
import { buildGraph } from "@/lib/rules/graph";
import type { ActionId, ActionNode, ExplanationOrigin, Fixture, ResidentFact, Source } from "@/lib/rules/types";
import { validateGraph } from "@/lib/rules/validate";
import {
  arbFactSet,
  arbFactValue,
  arbSourceStatuses,
  NUM_RUNS,
  v2Fixture,
  withSourceStatuses,
} from "./arbitraries";

const base = v2Fixture();

function run(facts: readonly ResidentFact[], fixture: Fixture = base, explanationOrigins?: Record<ActionId, ExplanationOrigin>) {
  const ef = splitFacts(facts, fixture.facts);
  const ev = evaluatePrograms(ef, fixture);
  if (!ev.ok) throw new Error("engine failed");
  const g = buildGraph({ evaluations: ev.value, facts: ef, fixture, explanationOrigins });
  if (!g.ok) throw new Error("build failed");
  return { evaluations: ev.value, graph: g.value };
}

const byId = (nodes: readonly ActionNode[]) => Object.fromEntries(nodes.map((n) => [n.id, n]));
const omit = <T extends object>(o: T, keys: (keyof T)[]) =>
  Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k as keyof T)));

const requiredFactIds = [...new Set(base.rules.flatMap((r) => r.predicates.map((p) => p.factId)))];
const defOf = (id: string) => base.facts.find((d) => d.id === id)!;

describe("graph builder (property)", () => {
  // Feature: action-graph, Property 1: Pipeline determinism
  it("Property 1: identical inputs and rule versions give deeply equal results", () => {
    fc.assert(
      fc.property(arbFactSet(), (facts) => {
        expect(run(structuredClone(facts))).toEqual(run(structuredClone(facts)));
      }),
      NUM_RUNS,
    );
  });

  // Feature: action-graph, Property 4: Unconfirmed values never change matching
  it("Property 4a: replacing an unconfirmed fact's value leaves evaluations and graph equal", () => {
    const arb = arbFactSet().chain((facts) => {
      const idx = facts.flatMap((f, i) => (f.confirmation === "unconfirmed" ? [i] : []));
      if (idx.length === 0) return fc.constant({ facts, swapped: facts });
      return fc.constantFrom(...idx).chain((i) =>
        arbFactValue(defOf(facts[i].id)).map((value) => ({
          facts,
          swapped: facts.map((f, j) => (j === i ? { ...f, value } : f)),
        })),
      );
    });
    fc.assert(
      fc.property(arb, ({ facts, swapped }) => {
        expect(run(swapped)).toEqual(run(facts));
      }),
      NUM_RUNS,
    );
  });

  it("Property 4b: absent and present-but-unconfirmed required facts give the same matching", () => {
    const arb = fc.constantFrom(...requiredFactIds).chain((id) =>
      fc.record({ facts: arbFactSet(), id: fc.constant(id), value: arbFactValue(defOf(id)) }),
    );
    fc.assert(
      fc.property(arb, ({ facts, id, value }) => {
        const rest = facts.filter((f) => f.id !== id);
        const a = run(rest);
        const b = run([...rest, { id, value, confirmation: "unconfirmed", origin: "user" }]);
        a.evaluations.forEach((e, i) => {
          expect(b.evaluations[i].predicateResults).toEqual(e.predicateResults);
          expect(b.evaluations[i].status).toBe(e.status);
        });
        const an = byId(a.graph.nodes);
        for (const n of b.graph.nodes) {
          expect(n.urgency).toBe(an[n.id].urgency);
          expect(n.deadline).toEqual(an[n.id].deadline);
          expect(n.status).toBe(an[n.id].status);
        }
      }),
      NUM_RUNS,
    );
  });

  // Feature: action-graph, Property 5: Neighborhood never changes matching
  it("Property 5: neighborhood never changes evaluations or the graph", () => {
    const arbNeighborhood = fc.option(
      fc.record({
        value: fc.oneof(fc.string({ maxLength: 100 }), fc.constant("unknown" as const)),
        confirmation: fc.constantFrom<ResidentFact["confirmation"]>("confirmed", "unconfirmed"),
      }),
      { nil: undefined },
    );
    fc.assert(
      fc.property(arbFactSet(), arbNeighborhood, (facts, nb) => {
        const without = facts.filter((f) => f.id !== "neighborhood");
        const withNb: ResidentFact[] = nb ? [...without, { id: "neighborhood", ...nb, origin: "user" }] : without;
        expect(run(withNb)).toEqual(run(without));
      }),
      NUM_RUNS,
    );
  });

  // Feature: action-graph, Property 6: Graph structural invariants and reference integrity
  it("Property 6: three distinct nodes, sorted, forward edges, valid references, validator passes", () => {
    const urgencyRank = { urgent: 0, standard: 1, unknown: 2 } as const;
    const tieRank = { raft: 0, utility: 1, snap: 2 } as const;
    fc.assert(
      fc.property(arbFactSet(), (facts) => {
        const { evaluations, graph } = run(facts);
        expect(evaluations.map((e) => e.programId)).toEqual(["snap", "raft", "utility"]);
        expect(graph.nodes).toHaveLength(3);
        expect(new Set(graph.nodes.map((n) => n.id)).size).toBe(3);
        expect(graph.nodes.map((n) => n.programId).sort()).toEqual(["raft", "snap", "utility"]);
        for (let i = 1; i < graph.nodes.length; i++) {
          const [p, q] = [graph.nodes[i - 1], graph.nodes[i]];
          const key = (n: ActionNode) => urgencyRank[n.urgency] * 10 + tieRank[n.programId];
          expect(key(p)).toBeLessThan(key(q));
        }
        const pos = graph.nodes.map((n) => n.id);
        for (const e of graph.edges) {
          expect(e.from).not.toBe(e.to);
          expect(pos.indexOf(e.from)).toBeGreaterThanOrEqual(0);
          expect(pos.indexOf(e.from)).toBeLessThan(pos.indexOf(e.to));
        }
        for (const n of graph.nodes) {
          const ev = evaluations.find((e) => e.programId === n.evaluationRef)!;
          const rule = base.rules.find((r) => r.id === n.ruleId)!;
          expect(rule).toBeDefined();
          expect(ev).toMatchObject({ ruleId: rule.id, ruleVersion: rule.version, fixtureVersion: base.version });
          expect(n.sourceIds.length).toBeGreaterThan(0);
          for (const sid of n.sourceIds) expect(base.sources.some((s) => s.id === sid)).toBe(true);
        }
        expect(validateGraph(graph)).toEqual([]);
      }),
      NUM_RUNS,
    );
  });

  // Feature: action-graph, Property 7: Dimension derivation
  it("Property 7: urgency, factConfirmation, sourceFreshness, and status follow their rules", () => {
    fc.assert(
      fc.property(arbFactSet(), arbSourceStatuses(), (facts, statuses) => {
        const fixture = withSourceStatuses(base, statuses);
        const { evaluations, graph } = run(facts, fixture);
        for (const n of graph.nodes) {
          const rule = fixture.rules.find((r) => r.id === n.ruleId)!;
          const ev = evaluations.find((e) => e.programId === n.evaluationRef)!;
          const trig = rule.urgencyTriggerFactId;
          const f = trig ? facts.find((x) => x.id === trig) : undefined;
          const expectedUrgency =
            trig === null ? "standard" : f?.confirmation === "confirmed" && f.value === true ? "urgent" : f?.confirmation === "confirmed" && f.value === false ? "standard" : "unknown";
          expect(n.urgency).toBe(expectedUrgency);
          expect(n.factConfirmation).toBe(
            ev.missingFactIds.length > 0 ? "has_missing" : ev.unconfirmedFactIds.length > 0 ? "has_unconfirmed" : "all_confirmed",
          );
          const cited = rule.sourceIds.map((id) => statuses[id].status);
          expect(n.sourceFreshness).toBe(cited.includes("stale") ? "stale" : cited.includes("unreviewed") ? "unreviewed" : "reviewed");
          expect(n.status).toBe(ev.status);
        }
      }),
      NUM_RUNS,
    );
  });

  // Feature: action-graph, Property 8: Dimensions are independent
  it("Property 8a: changing source statuses changes only sourceFreshness, deadline, and handoff", () => {
    fc.assert(
      fc.property(arbFactSet(), arbSourceStatuses(), arbSourceStatuses(), (facts, s1, s2) => {
        const a = run(facts, withSourceStatuses(base, s1));
        const b = run(facts, withSourceStatuses(base, s2));
        expect(b.evaluations).toEqual(a.evaluations);
        expect(b.graph.edges).toEqual(a.graph.edges);
        const keys: (keyof ActionNode)[] = ["sourceFreshness", "deadline", "handoff"];
        expect(b.graph.nodes.map((n) => omit(n, keys))).toEqual(a.graph.nodes.map((n) => omit(n, keys)));
      }),
      NUM_RUNS,
    );
  });

  it("Property 8b: changing explanationOrigins changes only explanationOrigin", () => {
    const arbOrigins = fc.record(
      Object.fromEntries(base.actions.map((a) => [a.id, fc.constantFrom<ExplanationOrigin>("generated", "rule_based")])),
      { requiredKeys: [] },
    ) as fc.Arbitrary<Record<ActionId, ExplanationOrigin>>;
    fc.assert(
      fc.property(arbFactSet(), arbOrigins, (facts, origins) => {
        const a = run(facts);
        const b = run(facts, base, origins);
        expect(b.evaluations).toEqual(a.evaluations);
        expect(b.graph.edges).toEqual(a.graph.edges);
        b.graph.nodes.forEach((n, i) => {
          expect(n.explanationOrigin).toBe(origins[n.id] ?? "rule_based");
          expect(omit(n, ["explanationOrigin"])).toEqual(omit(a.graph.nodes[i], ["explanationOrigin"]));
        });
      }),
      NUM_RUNS,
    );
  });

  it("Property 8c: changing a non-predicate urgency trigger changes only urgency and order", () => {
    // Test-only variant: R-SNAP's urgency is triggered by single_parent, which no predicate reads.
    const fixture = structuredClone(base);
    fixture.rules.find((r) => r.id === "R-SNAP")!.urgencyTriggerFactId = "single_parent";
    const arbTrigger = fc.option(
      fc.record({
        value: fc.constantFrom<ResidentFact["value"]>(true, false, "unknown"),
        confirmation: fc.constantFrom<ResidentFact["confirmation"]>("confirmed", "unconfirmed"),
      }),
      { nil: undefined },
    );
    fc.assert(
      fc.property(arbFactSet(), arbTrigger, arbTrigger, (facts, t1, t2) => {
        const rest = facts.filter((f) => f.id !== "single_parent");
        const withT = (t: typeof t1): ResidentFact[] => (t ? [...rest, { id: "single_parent", ...t, origin: "user" }] : rest);
        const a = run(withT(t1), fixture);
        const b = run(withT(t2), fixture);
        expect(b.evaluations).toEqual(a.evaluations);
        // reusedBy and edges follow graph order, so they may change with the order; compare reusedBy as sets.
        const norm = (n: ActionNode) => ({
          ...omit(n, ["urgency"]),
          evidence: n.evidence.map((e) => ({ ...e, reusedBy: [...e.reusedBy].sort() })),
        });
        const an = byId(a.graph.nodes);
        for (const n of b.graph.nodes) {
          expect(norm(n)).toEqual(norm(an[n.id]));
          if (n.id !== "A-SNAP") expect(n.urgency).toBe(an[n.id].urgency);
        }
      }),
      NUM_RUNS,
    );
  });

  // Feature: action-graph, Property 9: Handoff target selection
  it("Property 9: portal exactly when a cited source is reviewed with a URL (the first such); else human help", () => {
    // Test-only variant: each rule cites a second fictional source so "first such" is exercised.
    const twoSources = structuredClone(base);
    const extra: Source[] = twoSources.sources.map((s) => ({ ...s, id: `${s.id}-B`, title: `${s.title} (second)` }));
    twoSources.sources.push(...extra);
    for (const r of twoSources.rules) r.sourceIds = [...r.sourceIds, `${r.sourceIds[0]}-B`];
    const ids = twoSources.sources.map((s) => s.id);

    fc.assert(
      fc.property(arbFactSet(), arbSourceStatuses(ids, { allowMissingUrl: true }), (facts, statuses) => {
        const fixture = withSourceStatuses(twoSources, statuses);
        const { graph } = run(facts, fixture);
        for (const n of graph.nodes) {
          const cited = n.sourceIds.map((id) => fixture.sources.find((s) => s.id === id)!);
          const first = cited.find((s) => s.reviewStatus === "reviewed" && s.url !== null);
          const action = fixture.actions.find((a) => a.id === n.id)!;
          if (first) {
            expect(n.handoff).toEqual({ kind: "portal", sourceId: first.id, url: first.url, publisher: first.publisher });
          } else {
            expect(n.handoff).toEqual({ kind: "human", option: action.humanHelp });
          }
          if (n.handoff.kind === "portal") {
            const sid = n.handoff.sourceId;
            expect(fixture.sources.find((s) => s.id === sid)!.reviewStatus).toBe("reviewed");
          }
        }
      }),
      NUM_RUNS,
    );
  });
});
