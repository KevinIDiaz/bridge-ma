"use client";
// Task 4.1: thin memoized wrapper around evaluateBridge. No domain logic lives here.
import { useMemo } from "react";
import { fixtureResult } from "@/lib/data/programs";
import type { Locale } from "@/lib/i18n";
import { evaluateBridge } from "@/lib/rules/bridge";
import type {
  ActionId,
  BridgeError,
  BridgeEvaluationResult,
  Explanation,
  ExplanationOrigin,
  ResidentFact,
  Result,
} from "@/lib/rules/types";

/** Structural slice of Session_State (src/lib/session/store.ts) this hook reads. */
export interface JourneyInput {
  readonly facts: readonly ResidentFact[] | null;
  readonly explanations: Readonly<Record<string, Explanation>>;
}

/** Origins for the active locale from explanation keys `${actionId}:${locale}`. */
export function originsFor(
  explanations: Readonly<Record<string, Explanation>>,
  locale: Locale,
): Record<ActionId, ExplanationOrigin> {
  const suffix = `:${locale}`;
  const out: Record<ActionId, ExplanationOrigin> = {};
  for (const [key, e] of Object.entries(explanations)) {
    if (key.endsWith(suffix)) out[key.slice(0, -suffix.length)] = e.origin;
  }
  return out;
}

/** Local calendar date as YYYY-MM-DD (the handoff's generated-at date, Req 13.1). */
export function localDate(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Returns null when there is no session yet (RequireSession handles that case);
 * otherwise the full deterministic result or a BridgeError (show human help only).
 * Usage at integration: `useJourney(useSession(), lang)`.
 */
export function useJourney(input: JourneyInput, locale: Locale): Result<BridgeEvaluationResult, BridgeError> | null {
  const { facts, explanations } = input;
  return useMemo(() => {
    if (facts === null) return null;
    return evaluateBridge({
      facts,
      fixture: fixtureResult,
      explanationOrigins: originsFor(explanations, locale),
      today: localDate(),
    });
  }, [facts, explanations, locale]);
}
