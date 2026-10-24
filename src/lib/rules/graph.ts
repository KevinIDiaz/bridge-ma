import { computeDeadline } from "./deadline";
import { confirmedValue } from "./facts";
import type {
  ActionEdge,
  ActionGraph,
  ActionId,
  ActionNode,
  BuildError,
  EngineFacts,
  ExplanationOrigin,
  FactConfirmation,
  Fixture,
  HandoffTarget,
  HumanHelpOption,
  ProgramEvaluation,
  ProgramId,
  Result,
  ReusableEvidence,
  RuleVersion,
  Source,
  SourceFreshness,
  Urgency,
} from "./types";

const URGENCY_RANK: Record<Urgency, number> = { urgent: 0, standard: 1, unknown: 2 };
const PROGRAM_TIE_RANK: Record<ProgramId, number> = { raft: 0, utility: 1, snap: 2 };

export function deriveUrgency(rule: RuleVersion, facts: EngineFacts): Urgency {
  if (rule.urgencyTriggerFactId === null) return "standard";
  const v = confirmedValue(facts, rule.urgencyTriggerFactId);
  return v === true ? "urgent" : v === false ? "standard" : "unknown";
}

export function deriveFreshness(cited: readonly Source[]): SourceFreshness {
  if (cited.some((s) => s.reviewStatus === "stale")) return "stale";
  if (cited.some((s) => s.reviewStatus === "unreviewed")) return "unreviewed";
  return "reviewed";
}

export function deriveFactConfirmation(e: ProgramEvaluation): FactConfirmation {
  if (e.missingFactIds.length > 0) return "has_missing";
  if (e.unconfirmedFactIds.length > 0) return "has_unconfirmed";
  return "all_confirmed";
}

/** Portal only for the first cited reviewed source with a URL; otherwise a human help option. */
export function selectHandoff(cited: readonly Source[], humanHelp: HumanHelpOption): HandoffTarget {
  const s = cited.find((x) => x.reviewStatus === "reviewed" && x.url !== null);
  return s && s.url !== null
    ? { kind: "portal", sourceId: s.id, url: s.url, publisher: s.publisher }
    : { kind: "human", option: humanHelp };
}

/**
 * Builds the ordered action graph from evaluations and the fixture.
 * Order: urgency (urgent, standard, unknown), then raft, utility, snap.
 * Fixture edges are kept only when they point forward in that order (acyclic by construction).
 */
export function buildGraph(input: {
  evaluations: readonly ProgramEvaluation[];
  facts: EngineFacts;
  fixture: Fixture;
  explanationOrigins?: Readonly<Record<ActionId, ExplanationOrigin>>;
}): Result<ActionGraph, BuildError> {
  const { evaluations, facts, fixture } = input;
  const origins = input.explanationOrigins ?? {};
  const errors: BuildError[] = [];
  const nodes: ActionNode[] = [];

  for (const action of fixture.actions) {
    const evaluation = evaluations.find((e) => e.programId === action.programId);
    const rule = fixture.rules.find((r) => r.id === action.ruleId);
    if (!evaluation) errors.push({ kind: "missing_ref", ref: "evaluation", id: action.programId });
    if (!rule) errors.push({ kind: "missing_ref", ref: "rule", id: action.ruleId });
    if (!evaluation || !rule) continue;

    const cited: Source[] = [];
    for (const sid of rule.sourceIds) {
      const s = fixture.sources.find((x) => x.id === sid);
      if (!s) errors.push({ kind: "missing_ref", ref: "source", id: sid });
      else cited.push(s);
    }
    if (cited.length !== rule.sourceIds.length) continue;

    nodes.push({
      id: action.id,
      programId: action.programId,
      evaluationRef: evaluation.programId,
      ruleId: rule.id,
      sourceIds: [...rule.sourceIds],
      status: evaluation.status,
      urgency: deriveUrgency(rule, facts),
      sourceFreshness: deriveFreshness(cited),
      factConfirmation: deriveFactConfirmation(evaluation),
      explanationOrigin: Object.hasOwn(origins, action.id) ? origins[action.id] : "rule_based",
      nextStepKey: action.nextStepKey,
      evidence: [],
      deadline: computeDeadline(rule, fixture.sources, facts),
      handoff: selectHandoff(cited, action.humanHelp),
    });
  }
  if (errors.length > 0) return { ok: false, errors };

  nodes.sort(
    (a, b) =>
      URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || PROGRAM_TIE_RANK[a.programId] - PROGRAM_TIE_RANK[b.programId],
  );
  const order = nodes.map((n) => n.id);

  // Evidence with reuse: other nodes needing the same evidence type, in graph order.
  for (const node of nodes) {
    node.evidence = fixture.evidenceRequirements
      .filter((q) => q.actionId === node.id)
      .map((q) => ({
        evidenceTypeId: q.evidenceTypeId,
        level: q.level,
        reusedBy: order.filter(
          (other) =>
            other !== node.id &&
            fixture.evidenceRequirements.some((r) => r.actionId === other && r.evidenceTypeId === q.evidenceTypeId),
        ),
      }));
  }

  const edges: ActionEdge[] = fixture.edges
    .filter((e) => {
      const f = order.indexOf(e.from);
      const t = order.indexOf(e.to);
      return f !== -1 && t !== -1 && f < t;
    })
    .map((e) => ({ from: e.from, to: e.to, reasonKey: e.reasonKey }));

  return { ok: true, value: { nodes, edges } };
}

/**
 * Deduplicated evidence list: each referenced type once, in first-appearance order
 * (graph order, then fixture order), with every using action in graph order.
 */
export function collectReusableEvidence(graph: ActionGraph, fixture: Fixture): ReusableEvidence[] {
  const synthetic = (ruleId: string) => fixture.rules.find((r) => r.id === ruleId)?.synthetic ?? true;
  const byType = new Map<string, { uses: { actionId: ActionId; level: "required" | "helpful" }[]; synthetic: boolean }>();
  for (const node of graph.nodes) {
    for (const ev of node.evidence) {
      const entry = byType.get(ev.evidenceTypeId) ?? { uses: [], synthetic: false };
      entry.uses.push({ actionId: node.id, level: ev.level });
      entry.synthetic ||= synthetic(node.ruleId);
      byType.set(ev.evidenceTypeId, entry);
    }
  }
  return [...byType].map(([evidenceTypeId, e]) => ({ evidenceTypeId, uses: e.uses, synthetic: e.synthetic }));
}
