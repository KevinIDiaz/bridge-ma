import type { EngineFacts, FactDef, FactId, FactValue, ResidentFact, Unknown } from "./types";

/**
 * Splits resident facts into confirmed values and unconfirmed IDs.
 * Area-context facts (neighborhood) and facts with no FactDef are dropped,
 * so they can never reach the engine. Unconfirmed values are never copied.
 */
export function splitFacts(facts: readonly ResidentFact[], defs: readonly FactDef[]): EngineFacts {
  const allowed = new Set(defs.filter((d) => d.areaContext !== true).map((d) => d.id));
  const confirmed: Record<FactId, FactValue | Unknown> = {};
  const unconfirmed: FactId[] = [];
  for (const f of facts) {
    if (!allowed.has(f.id)) continue;
    if (f.confirmation === "confirmed") {
      confirmed[f.id] = f.value;
    } else if (!unconfirmed.includes(f.id)) {
      unconfirmed.push(f.id);
    }
  }
  // A fact listed as unconfirmed must not also carry a confirmed value.
  for (const id of unconfirmed) delete confirmed[id];
  return { confirmed, unconfirmedIds: unconfirmed };
}

/** Confirmed value for `id`, or "unknown" when absent, unconfirmed, or unknown. */
export function confirmedValue(facts: EngineFacts, id: FactId): FactValue | Unknown {
  if (facts.unconfirmedIds.includes(id)) return "unknown";
  return Object.hasOwn(facts.confirmed, id) ? facts.confirmed[id] : "unknown";
}
