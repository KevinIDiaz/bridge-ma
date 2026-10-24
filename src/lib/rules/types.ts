// Shared domain types for the deterministic rules engine (engine not built yet).
// Wording of statuses follows provisional decision D-010.

/** Tri-state value. "unknown" is never treated as false. */
export type TriState<T = boolean> = T | "unknown";

export interface Fact<T = boolean> {
  value: TriState<T>;
  /** Extracted facts start unconfirmed; matching may only use confirmed facts. */
  confirmed: boolean;
  origin: "user" | "extracted";
}

export type MatchStatus = "may_match" | "likely_not" | "cant_tell";
