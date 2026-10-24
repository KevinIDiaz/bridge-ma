import { confirmedValue } from "./facts";
import type {
  EngineError,
  EngineFacts,
  FactId,
  Fixture,
  MatchStatus,
  PredicateResult,
  ProgramEvaluation,
  ProgramId,
  Result,
  TriState,
} from "./types";

export const PROGRAM_ORDER: readonly ProgramId[] = ["snap", "raft", "utility"];

/**
 * Deterministic three-valued evaluation of each program's single RuleVersion.
 * Kleene AND: any false -> likely_not; else any unknown -> cant_tell; else may_match.
 * No clock, randomness, or I/O. Unconfirmed values are never read.
 */
export function evaluatePrograms(facts: EngineFacts, fixture: Fixture): Result<ProgramEvaluation[], EngineError> {
  const errors: EngineError[] = [];
  const evaluations: ProgramEvaluation[] = [];

  for (const programId of PROGRAM_ORDER) {
    const rules = fixture.rules.filter((r) => r.programId === programId);
    if (rules.length !== 1 || rules[0].predicates.length === 0) {
      errors.push({ kind: "rule_count", programId });
      continue;
    }
    const rule = rules[0];

    const predicateResults: PredicateResult[] = rule.predicates.map((p) => {
      const v = confirmedValue(facts, p.factId);
      const result: TriState = v === "unknown" ? "unknown" : v === p.value;
      return { predicateId: p.id, factId: p.factId, result };
    });

    const results = predicateResults.map((r) => r.result);
    const status: MatchStatus = results.includes(false)
      ? "likely_not"
      : results.includes("unknown")
        ? "cant_tell"
        : "may_match";

    const required: FactId[] = [];
    for (const p of rule.predicates) if (!required.includes(p.factId)) required.push(p.factId);
    const missingFactIds: FactId[] = [];
    const unconfirmedFactIds: FactId[] = [];
    for (const id of required) {
      if (facts.unconfirmedIds.includes(id)) unconfirmedFactIds.push(id);
      else if (confirmedValue(facts, id) === "unknown") missingFactIds.push(id);
    }

    evaluations.push({
      programId,
      status,
      ruleId: rule.id,
      ruleVersion: rule.version,
      fixtureVersion: fixture.version,
      predicateResults,
      missingFactIds,
      unconfirmedFactIds,
      sourceIds: [...rule.sourceIds],
    });
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: evaluations };
}
