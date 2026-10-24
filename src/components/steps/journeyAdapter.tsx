"use client";

// TEMPORARY replaceable adapter (Teammate 2, feature/action-plan-handoff).
//
// Steps 3–6 read the journey only through this file, so integration changes one place:
//   useJourneyState  → wrap the Lead's `useJourney` (evaluateBridge over session facts + fixtureResult)
//                      and Teammate 1's session store (`facts === null` → "no_session").
//   useExplanations  → read explanations stored by `explainWithFallback` in the session store.
//   StepTitle        → replace with Teammate 1's `StepHeading`.
//   NoSessionNotice  → replace with Teammate 1's `RequireSession` (same text and link).
//
// Until then it serves the hand-written stub in ./stubJourney.ts. Nothing here evaluates rules.
import Link from "next/link";
import { useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import { explanationTemplate } from "@/lib/i18n/localize";
import type { ActionId, BridgeError, BridgeEvaluationResult, Explanation, Fixture } from "@/lib/rules/types";
import { STUB_FIXTURE, STUB_RESULT } from "./stubJourney";

export type JourneyState =
  | { kind: "no_session" }
  | { kind: "error"; errors: BridgeError[] }
  | { kind: "ok"; result: BridgeEvaluationResult; fixture: Fixture };

const noopSubscribe = () => () => {};

/** Local calendar date as YYYY-MM-DD. Read on the client only (null during server render). */
function localToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The handoff date is the local date (Req 13.1). Server render uses null to avoid a hydration mismatch. */
export function useLocalToday(): string | null {
  return useSyncExternalStore(noopSubscribe, localToday, () => null);
}

export function useJourneyState(): JourneyState {
  const today = useLocalToday();
  return useMemo<JourneyState>(() => {
    const result: BridgeEvaluationResult = today
      ? { ...STUB_RESULT, handoff: { ...STUB_RESULT.handoff, generatedAt: today } }
      : STUB_RESULT;
    return { kind: "ok", result, fixture: STUB_FIXTURE };
  }, [today]);
}

/**
 * Explanations per action. Stub: the deterministic dictionary template, origin `rule_based`
 * (what `explainWithFallback(demoAdapter, …)` returns). Explanation text never feeds back into the result.
 */
export function useExplanations(
  result: BridgeEvaluationResult | null,
  lang: Locale,
): Readonly<Record<ActionId, Explanation | undefined>> {
  return useMemo(() => {
    if (!result) return {};
    const dict = getDictionary(lang);
    return Object.fromEntries(
      result.graph.nodes.map((n) => [n.id, { text: explanationTemplate(dict, n.programId, n.status), origin: "rule_based" as const }]),
    );
  }, [result, lang]);
}

/** Stand-in for StepHeading: the one h1 per step, focused on mount (Req 15.8). */
export function StepTitle({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <h1 ref={ref} tabIndex={-1}>
      {children}
    </h1>
  );
}

/** Stand-in for RequireSession's empty-session message (Req 12.7). */
export function NoSessionNotice({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).journey;
  return (
    <div className="notice" role="status">
      <p>{t.noSession}</p>
      <p>
        <Link href={`/${lang}/story`}>{t.startOver}</Link>
      </p>
    </div>
  );
}
