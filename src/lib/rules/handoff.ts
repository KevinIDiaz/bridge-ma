import { collectReusableEvidence } from "./graph";
import type { ActionGraph, FactId, Fixture, HandoffPacket, ProgramEvaluation, ResidentFact } from "./types";

/**
 * Builds the printable handoff packet. Pure: `today` (YYYY-MM-DD) is supplied by the UI.
 * Area-context facts (neighborhood) are left out. A missing fact is never shown as false.
 */
export function buildHandoffPacket(input: {
  graph: ActionGraph;
  facts: readonly ResidentFact[];
  evaluations: readonly ProgramEvaluation[];
  fixture: Fixture;
  today: string;
}): HandoffPacket {
  const { graph, facts, evaluations, fixture, today } = input;
  const area = new Set(fixture.facts.filter((d) => d.areaContext === true).map((d) => d.id));

  const confirmedFacts = facts.filter((f) => f.confirmation === "confirmed" && !area.has(f.id)).map((f) => ({ ...f }));

  const unknownFacts: HandoffPacket["unknownFacts"] = [];
  const seen = new Set<FactId>();
  for (const e of evaluations) {
    for (const id of [...e.unconfirmedFactIds, ...e.missingFactIds]) {
      if (seen.has(id) || area.has(id)) continue;
      seen.add(id);
      const state = e.unconfirmedFactIds.includes(id)
        ? "unconfirmed"
        : facts.some((f) => f.id === id)
          ? "unknown"
          : "missing";
      unknownFacts.push({ factId: id, state });
    }
  }

  const ruleVersions = graph.nodes.map((n) => {
    const e = evaluations.find((x) => x.programId === n.evaluationRef);
    return { ruleId: n.ruleId, version: e?.ruleVersion ?? 0 };
  });

  return {
    confirmedFacts,
    unknownFacts,
    actions: graph.nodes,
    evidence: collectReusableEvidence(graph, fixture),
    handoffTargets: graph.nodes.map((n) => ({ actionId: n.id, target: n.handoff })),
    fixtureVersion: fixture.version,
    ruleVersions,
    generatedAt: today,
  };
}
