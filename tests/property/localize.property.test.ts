// Property tests for the Localizer. Pre-integration these generate arbitrary, well-formed
// BridgeEvaluationResult values directly (the Lead's arbFactSet + pipeline is not merged yet).
// At integration they can also be driven by arbFactSet → evaluateBridge.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { STUB_FIXTURE, STUB_RESULT } from "@/components/steps/stubJourney";
import { getDictionary, type Locale } from "@/lib/i18n";
import { localizeActionCards, localizeEvidence, localizeHandoff, localizeHelp } from "@/lib/i18n/localize";
import type {
  ActionNode,
  BridgeEvaluationResult,
  Deadline,
  ProgramEvaluation,
  ProgramId,
  ReusableEvidence,
} from "@/lib/rules/types";

const PROGRAMS: ProgramId[] = ["snap", "raft", "utility"];
const ACTION: Record<ProgramId, string> = { snap: "A-SNAP", raft: "A-RAFT", utility: "A-UTIL" };
const RULE: Record<ProgramId, string> = { snap: "R-SNAP", raft: "R-RAFT", utility: "R-UTIL" };
const EVIDENCE = ["E-ID", "E-JOB-LOSS", "E-HOUSEHOLD", "E-NTQ", "E-LEASE", "E-UTIL-BILL"];
const FACT_IDS = STUB_FIXTURE.facts.filter((f) => !f.areaContext).map((f) => f.id);

const arbDeadline: fc.Arbitrary<Deadline> = fc.oneof(
  fc.constantFrom("source_unreviewed", "unsupported", "facts_unconfirmed").map((reason) => ({ kind: "unknown" as const, reason })),
  fc
    .date({ min: new Date("2026-01-01"), max: new Date("2030-12-31"), noInvalidDate: true })
    .map((d) => ({ kind: "computed" as const, date: d.toISOString().slice(0, 10), ruleId: "R-X", sourceId: "S-X" })),
);

/** A structurally valid result: 3 nodes (one per program, any order), forward-only edges, deduped evidence. */
const arbResult: fc.Arbitrary<BridgeEvaluationResult> = fc
  .record({
    order: fc.shuffledSubarray(PROGRAMS, { minLength: 3, maxLength: 3 }),
    perProgram: fc.tuple(
      ...PROGRAMS.map(() =>
        fc.record({
          status: fc.constantFrom("may_match", "likely_not", "cant_tell" as const),
          urgency: fc.constantFrom("urgent", "standard", "unknown" as const),
          sourceFreshness: fc.constantFrom("reviewed", "unreviewed", "stale" as const),
          factConfirmation: fc.constantFrom("all_confirmed", "has_unconfirmed", "has_missing" as const),
          explanationOrigin: fc.constantFrom("generated", "rule_based" as const),
          deadline: arbDeadline,
          ruleVersion: fc.integer({ min: 1, max: 9 }),
          missing: fc.subarray(FACT_IDS),
          unconfirmed: fc.subarray(FACT_IDS),
          evidence: fc.subarray(EVIDENCE.map((id) => ({ id, level: "required" as const }))).chain((xs) =>
            fc.tuple(...xs.map((x) => fc.constantFrom("required", "helpful" as const).map((level) => ({ ...x, level })))),
          ),
          humanHelp: fc.constantFrom("legal_aid", "program_office", "general_help_line" as const),
        }),
      ),
    ),
    edgeMask: fc.array(fc.boolean(), { minLength: 3, maxLength: 3 }),
    generatedAt: fc.constantFrom("2026-10-24", "2027-01-05"),
  })
  .map(({ order, perProgram, edgeMask, generatedAt }) => {
    const byProgram = Object.fromEntries(PROGRAMS.map((p, i) => [p, perProgram[i]])) as Record<ProgramId, (typeof perProgram)[number]>;
    const nodes: ActionNode[] = order.map((p) => {
      const x = byProgram[p];
      return {
        id: ACTION[p],
        programId: p,
        evaluationRef: p,
        ruleId: RULE[p],
        sourceIds: STUB_FIXTURE.rules.find((r) => r.id === RULE[p])!.sourceIds,
        status: x.status,
        urgency: x.urgency,
        sourceFreshness: x.sourceFreshness,
        factConfirmation: x.factConfirmation,
        explanationOrigin: x.explanationOrigin,
        nextStepKey: `nextStep.${p}`,
        evidence: [],
        deadline: x.deadline,
        handoff: { kind: "human", option: x.humanHelp },
      };
    });
    for (const n of nodes) {
      n.evidence = byProgram[n.programId].evidence.map((e) => ({
        evidenceTypeId: e.id,
        level: e.level,
        reusedBy: nodes.filter((o) => o.id !== n.id && byProgram[o.programId].evidence.some((oe) => oe.id === e.id)).map((o) => o.id),
      }));
    }
    const pairs: [number, number][] = [
      [0, 1],
      [0, 2],
      [1, 2],
    ];
    const edges = pairs
      .filter((_, i) => edgeMask[i])
      .map(([a, b]) => ({ from: nodes[a].id, to: nodes[b].id, reasonKey: "edge.housing_first" }));
    const evidence: ReusableEvidence[] = [];
    for (const n of nodes) {
      for (const e of n.evidence) {
        let row = evidence.find((r) => r.evidenceTypeId === e.evidenceTypeId);
        if (!row) evidence.push((row = { evidenceTypeId: e.evidenceTypeId, uses: [], synthetic: true }));
        (row.uses as { actionId: string; level: "required" | "helpful" }[]).push({ actionId: n.id, level: e.level });
      }
    }
    const evaluations: ProgramEvaluation[] = PROGRAMS.map((p) => ({
      programId: p,
      status: byProgram[p].status,
      ruleId: RULE[p],
      ruleVersion: byProgram[p].ruleVersion,
      fixtureVersion: 2,
      predicateResults: [],
      missingFactIds: byProgram[p].missing,
      unconfirmedFactIds: byProgram[p].unconfirmed.filter((id) => !byProgram[p].missing.includes(id)),
      sourceIds: STUB_FIXTURE.rules.find((r) => r.id === RULE[p])!.sourceIds,
    }));
    return {
      fixtureVersion: 2,
      facts: STUB_RESULT.facts,
      evaluations,
      graph: { nodes, edges },
      evidence,
      handoff: {
        ...STUB_RESULT.handoff,
        actions: nodes,
        evidence,
        handoffTargets: nodes.map((n) => ({ actionId: n.id, target: n.handoff })),
        ruleVersions: evaluations.map((e) => ({ ruleId: e.ruleId, version: e.ruleVersion })),
        generatedAt,
      },
    };
  });

const dict = (l: Locale) => getDictionary(l);

/** Only the structured (non-display) fields of every localized view. */
function structureOf(l: Locale, r: BridgeEvaluationResult) {
  const cards = localizeActionCards(dict(l), l, r, STUB_FIXTURE).map((c) => ({
    id: c.id,
    programId: c.programId,
    status: c.status,
    dims: c.dimensions.map((d) => [d.name, d.value]),
    ruleId: c.ruleId,
    ruleVersion: c.ruleVersion,
    fixtureVersion: c.fixtureVersion,
    sourceIds: c.sourceIds,
    deadline: c.deadline,
    missing: c.missingFactIds,
    unconfirmed: c.unconfirmedFactIds,
    edgesIn: c.edgesIn,
    evidence: c.evidence.map((e) => [e.evidenceTypeId, e.level, e.reusedBy.map((u) => u.actionId)]),
    handoff: c.handoff.target,
  }));
  const evidence = localizeEvidence(dict(l), r.evidence, r.graph.nodes).map((e) => [
    e.evidenceTypeId,
    e.synthetic,
    e.uses.map((u) => [u.actionId, u.level]),
  ]);
  const help = localizeHelp(dict(l), l, r, STUB_FIXTURE);
  const helpStructure = {
    cantTell: help.cantTell.map((p) => [p.programId, p.missing.map((f) => f.factId), p.unconfirmed.map((f) => f.factId)]),
    rules: help.syntheticRules.map((x) => [x.ruleId, x.ruleVersion]),
    sources: help.unreviewedSources.map((s) => [s.id, s.reviewStatus]),
    humanHelp: help.humanHelp.map((h) => h.option),
    legalAid: help.legalAidNotice !== null,
  };
  const h = localizeHandoff(dict(l), l, r.handoff, STUB_FIXTURE);
  const handoff = {
    actions: h.actions.map((a) => [a.id, a.status, a.ruleId, a.ruleVersion, a.deadline, a.dimensions.map((d) => d.value)]),
    confirmed: h.confirmedFacts.map((f) => [f.factId, f.value]),
    unknown: h.unknownFacts.map((f) => [f.factId, f.state]),
    targets: h.targets.map((t) => [t.actionId, t.view.target]),
    fixtureVersion: h.fixtureVersion,
    generatedAt: h.generatedAt,
  };
  return { cards, evidence, help: helpStructure, handoff, edges: r.graph.edges };
}

describe("Localizer properties", () => {
  // Feature: action-graph, Property 16: Locale never changes structure
  it("Property 16: en and es views have deeply equal structured fields", () => {
    fc.assert(
      fc.property(arbResult, (r) => {
        expect(structureOf("es", r)).toEqual(structureOf("en", r));
        // Cards come out in graph order with nothing added or dropped.
        expect(localizeActionCards(dict("es"), "es", r, STUB_FIXTURE).map((c) => c.id)).toEqual(r.graph.nodes.map((n) => n.id));
      }),
      { numRuns: 100 },
    );
  });

  // Feature: action-graph, Property 10: Evidence reuse is consistent
  it("Property 10: each document appears once, in order, naming every action that uses it", () => {
    fc.assert(
      fc.property(arbResult, fc.constantFrom<Locale>("en", "es"), (r, l) => {
        const rows = localizeEvidence(dict(l), r.evidence, r.graph.nodes);
        const ids = rows.map((x) => x.evidenceTypeId);
        expect(new Set(ids).size).toBe(ids.length);
        // First appearance: graph order, then the node's own requirement order.
        const expected: string[] = [];
        for (const n of r.graph.nodes) for (const e of n.evidence) if (!expected.includes(e.evidenceTypeId)) expected.push(e.evidenceTypeId);
        expect(ids).toEqual(expected);
        for (const row of rows) {
          const users = r.graph.nodes.filter((n) => n.evidence.some((e) => e.evidenceTypeId === row.evidenceTypeId));
          expect(row.uses.map((u) => u.actionId)).toEqual(users.map((n) => n.id));
          for (const u of row.uses) {
            const req = users.find((n) => n.id === u.actionId)!.evidence.find((e) => e.evidenceTypeId === row.evidenceTypeId)!;
            expect(u.level).toBe(req.level);
          }
          expect(row.reused).toBe(row.uses.length > 1);
        }
        // Card reuse text names exactly the other users.
        for (const c of localizeActionCards(dict(l), l, r, STUB_FIXTURE)) {
          for (const e of c.evidence) {
            const others = r.graph.nodes.filter((n) => n.id !== c.id && n.evidence.some((x) => x.evidenceTypeId === e.evidenceTypeId));
            expect(e.reusedBy.map((u) => u.actionId)).toEqual(others.map((n) => n.id));
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it("missing and unknown states stay visible in every locale", () => {
    fc.assert(
      fc.property(arbResult, fc.constantFrom<Locale>("en", "es"), (r, l) => {
        for (const c of localizeActionCards(dict(l), l, r, STUB_FIXTURE)) {
          const ev = r.evaluations.find((e) => e.programId === c.programId)!;
          expect(c.missing.map((f) => f.factId)).toEqual(ev.missingFactIds);
          expect(c.unconfirmed.map((f) => f.factId)).toEqual(ev.unconfirmedFactIds);
          expect(c.noneMissing === null).toBe(ev.missingFactIds.length + ev.unconfirmedFactIds.length > 0);
          if (c.deadline.kind === "unknown") expect(c.deadlineText).toBe(dict(l).deadline.unknown);
          if (c.sourceFreshness !== "reviewed") expect(c.handoff.url).toBeNull();
        }
      }),
      { numRuns: 100 },
    );
  });
});
