// Session_State: a module-level, in-memory store for the resident's facts and
// cached explanations (D-034). It is React-free so unit tests can run it directly.
//
// Rules this store enforces:
// - Writes happen only in client event handlers; the server snapshot is always
//   EMPTY_SESSION, so no state is ever shared across requests.
// - Nothing touches cookies or storage. State is lost on reload by construction
//   (privacy: Req 1.6, 14.2).
// - updateFact resets a fact to "unconfirmed" and clears cached explanations,
//   because a changed fact can change the whole graph.

import type { Explanation, FactId, FactValue, ResidentFact, Unknown } from "@/lib/rules/types";

export interface SessionState {
  /** null = no session yet (nothing entered). */
  facts: ResidentFact[] | null;
  /** key `${actionId}:${locale}` → explanation text + origin. */
  explanations: Record<string, Explanation>;
}

/** Server snapshot for useSyncExternalStore. Never mutated. */
export const EMPTY_SESSION: SessionState = Object.freeze({
  facts: null,
  explanations: Object.freeze({}),
}) as SessionState;

let state: SessionState = EMPTY_SESSION;
const listeners = new Set<() => void>();

function emit(): void {
  for (const fn of listeners) fn();
}

/** Returns the current snapshot. Reference changes on every write (for useSyncExternalStore). */
function get(): SessionState {
  return state;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Called from Intake with every fact as "unconfirmed". Starts a fresh session. */
function setFacts(facts: ResidentFact[]): void {
  state = { facts: facts.map((f) => ({ ...f })), explanations: {} };
  emit();
}

/** Marks one fact confirmed. The value is left untouched (including "unknown"). */
function confirmFact(id: FactId): void {
  if (!state.facts) return;
  let changed = false;
  const facts = state.facts.map((f) => {
    if (f.id !== id || f.confirmation === "confirmed") return f;
    changed = true;
    return { ...f, confirmation: "confirmed" as const };
  });
  if (!changed) return;
  state = { ...state, facts };
  emit();
}

/**
 * Sets a fact's value and resets it to "unconfirmed". Clears cached explanations,
 * because a changed fact can change the graph (Req 2.3, 14.2 via re-confirmation).
 */
function updateFact(id: FactId, value: FactValue | Unknown): void {
  if (!state.facts) return;
  let found = false;
  const facts = state.facts.map((f) => {
    if (f.id !== id) return f;
    found = true;
    return { ...f, value, confirmation: "unconfirmed" as const };
  });
  if (!found) return;
  state = { facts, explanations: {} };
  emit();
}

/** Stores a generated/template explanation under `${actionId}:${locale}`. */
function setExplanation(key: string, e: Explanation): void {
  state = { ...state, explanations: { ...state.explanations, [key]: e } };
  emit();
}

export const session = {
  get,
  subscribe,
  setFacts,
  confirmFact,
  updateFact,
  setExplanation,
};
