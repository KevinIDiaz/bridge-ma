import { confirmedValue } from "./facts";
import type { Deadline, EngineFacts, RuleVersion, Source } from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDate(v: unknown): number | null {
  if (typeof v !== "string" || !ISO_DATE.test(v)) return null;
  const t = Date.parse(`${v}T00:00:00Z`);
  if (Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== v) return null;
  return t;
}

/**
 * Typed deadline. Precedence: source_unreviewed > unsupported > facts_unconfirmed.
 * A date is computed only from a reviewed source rule and a confirmed date fact.
 * UTC arithmetic; never reads the clock.
 */
export function computeDeadline(rule: RuleVersion, sources: readonly Source[], facts: EngineFacts): Deadline {
  const cited = rule.sourceIds.map((id) => sources.find((s) => s.id === id));
  if (cited.length === 0 || cited.some((s) => !s || s.reviewStatus !== "reviewed")) {
    return { kind: "unknown", reason: "source_unreviewed" };
  }
  if (rule.deadline === null) return { kind: "unknown", reason: "unsupported" };

  const start = parseIsoDate(confirmedValue(facts, rule.deadline.factId));
  if (start === null) return { kind: "unknown", reason: "facts_unconfirmed" };

  const date = new Date(start + rule.deadline.offsetDays * 86_400_000).toISOString().slice(0, 10);
  if (!ISO_DATE.test(date)) return { kind: "unknown", reason: "facts_unconfirmed" };
  return { kind: "computed", date, ruleId: rule.id, sourceId: rule.sourceIds[0] };
}
