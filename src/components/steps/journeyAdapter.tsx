"use client";

// Journey adapter for steps 3–6 (Teammate 2's seam, wired by the Lead at integration).
//
//   useJourneyState  → Lead's `useJourney` (evaluateBridge over session facts + fixtureResult)
//                      and Teammate 1's session store (`facts === null` → "no_session").
//   useExplanations  → explanations stored by `explainWithFallback` in the session store.
//   StepTitle        → Teammate 1's `StepHeading`.
//   NoSessionNotice  → same text and link as `RequireSession`, without a second <main>.
//
// Nothing here evaluates rules. ./stubJourney.ts is now used only by unit tests.
import Link from "next/link";
import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { StepHeading } from "@/components/StepHeading";
import { useJourney } from "@/components/useJourney";
import { useSession } from "@/components/useSession";
import { fixtureResult } from "@/lib/data/programs";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import { getModelAdapter } from "@/lib/model/adapter";
import { explainWithFallback } from "@/lib/model/explain";
import type { ActionId, BridgeError, BridgeEvaluationResult, Explanation, Fixture } from "@/lib/rules/types";
import { session } from "@/lib/session/store";

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

/** Deterministic journey result for the current session. `lang` only selects explanation origins. */
export function useJourneyState(lang: Locale): JourneyState {
  const s = useSession();
  const result = useJourney(s, lang);
  return useMemo<JourneyState>(() => {
    if (result === null) return { kind: "no_session" };
    if (!result.ok || !fixtureResult.ok) return { kind: "error", errors: result.ok ? [] : result.errors };
    return { kind: "ok", result: result.value, fixture: fixtureResult.value };
  }, [result]);
}

/**
 * Explanations per action for the active locale, keyed `${actionId}:${lang}` in Session_State.
 * Runs only on an ok result; missing entries are requested via explainWithFallback (demo adapter:
 * dictionary template, origin rule_based). Explanation text never feeds back into the result.
 */
export function useExplanations(
  result: BridgeEvaluationResult | null,
  lang: Locale,
): Readonly<Record<ActionId, Explanation | undefined>> {
  const { explanations } = useSession();

  useEffect(() => {
    if (!result) return;
    let cancelled = false;
    const adapter = getModelAdapter();
    for (const n of result.graph.nodes) {
      const key = `${n.id}:${lang}`;
      if (session.get().explanations[key]) continue;
      void explainWithFallback(adapter, { programId: n.programId, status: n.status, locale: lang }).then((e) => {
        if (!cancelled && e.text.trim() !== "") session.setExplanation(key, e);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [result, lang]);

  return useMemo(() => {
    if (!result) return {};
    return Object.fromEntries(result.graph.nodes.map((n) => [n.id, explanations[`${n.id}:${lang}`]]));
  }, [result, lang, explanations]);
}

/** The one h1 per step, focused on mount (Req 15.8). */
export function StepTitle({ children }: { children: ReactNode }) {
  return <StepHeading>{children}</StepHeading>;
}

/** Empty-session message with a link to step 1 (Req 12.7). */
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
