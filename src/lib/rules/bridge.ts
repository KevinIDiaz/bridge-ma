// Single integration entry point between the domain layer and the UI (D-040).
// Pure and React-free; imports nothing from @/lib/model.
import { evaluatePrograms } from "./engine";
import { splitFacts } from "./facts";
import { buildGraph, collectReusableEvidence } from "./graph";
import { buildHandoffPacket } from "./handoff";
import type {
  ActionId,
  BridgeError,
  BridgeEvaluationResult,
  ExplanationOrigin,
  Fixture,
  FixtureError,
  ResidentFact,
  Result,
} from "./types";
import { validateGraph } from "./validate";

/**
 * facts -> splitFacts -> evaluatePrograms -> buildGraph -> validateGraph -> evidence -> handoff.
 * Returns the first failing stage's errors and no partial result.
 * There is no locale input: display language cannot change evaluation.
 */
export function evaluateBridge(input: {
  facts: readonly ResidentFact[];
  fixture: Result<Fixture, FixtureError>;
  explanationOrigins?: Readonly<Record<ActionId, ExplanationOrigin>>;
  today: string;
}): Result<BridgeEvaluationResult, BridgeError> {
  if (!input.fixture.ok) return { ok: false, errors: [{ kind: "fixture_error", errors: input.fixture.errors }] };
  const fixture = input.fixture.value;

  const engineFacts = splitFacts(input.facts, fixture.facts);
  const evaluated = evaluatePrograms(engineFacts, fixture);
  if (!evaluated.ok) return { ok: false, errors: [{ kind: "engine_error", errors: evaluated.errors }] };

  const built = buildGraph({
    evaluations: evaluated.value,
    facts: engineFacts,
    fixture,
    explanationOrigins: input.explanationOrigins,
  });
  if (!built.ok) return { ok: false, errors: [{ kind: "build_error", errors: built.errors }] };

  const graphErrors = validateGraph(built.value);
  if (graphErrors.length > 0) return { ok: false, errors: [{ kind: "graph_error", errors: graphErrors }] };

  const graph = built.value;
  const handoff = buildHandoffPacket({
    graph,
    facts: input.facts,
    evaluations: evaluated.value,
    fixture,
    today: input.today,
  });

  return {
    ok: true,
    value: {
      fixtureVersion: fixture.version,
      facts: input.facts.map((f) => ({ ...f })),
      evaluations: evaluated.value,
      graph,
      evidence: collectReusableEvidence(graph, fixture),
      handoff,
    },
  };
}

export type { BridgeEvaluationResult, BridgeError } from "./types";
