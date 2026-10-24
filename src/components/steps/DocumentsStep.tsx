"use client";

// Step 4: each document once, with every action that uses it (Req 10). No upload control.
import { useMemo } from "react";
import { getDictionary, type Locale } from "@/lib/i18n";
import { localizeEvidence } from "@/lib/i18n/localize";
import { NoSessionNotice, StepTitle, useJourneyState } from "./journeyAdapter";
import { JourneyErrorNotice, StepNav } from "./StepParts";

export function DocumentsStep({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const t = dict.documents;
  const state = useJourneyState(lang);
  const rows = useMemo(
    () => (state.kind === "ok" ? localizeEvidence(dict, state.result.evidence, state.result.graph.nodes) : []),
    [state, dict],
  );

  return (
    <>
      <p className="step-label">{t.stepLabel}</p>
      <StepTitle>{t.title}</StepTitle>
      {state.kind === "no_session" ? (
        <NoSessionNotice lang={lang} />
      ) : state.kind === "error" ? (
        <JourneyErrorNotice lang={lang} />
      ) : (
        <>
          <p>{t.intro}</p>
          {rows.length === 0 ? (
            <p className="notice">{t.empty}</p>
          ) : (
            <ul className="evidence-rows">
              {rows.map((row) => (
                <li key={row.evidenceTypeId} className="evidence-row" data-evidence-id={row.evidenceTypeId}>
                  <h2>{row.label}</h2>
                  {row.reuseText ? <p className="reuse-note">{row.reuseText}</p> : null}
                  {row.syntheticLabel ? <p className="badge badge-synthetic">{row.syntheticLabel}</p> : null}
                  <p className="uses-label">{t.usedFor}:</p>
                  <ul>
                    {row.uses.map((u) => (
                      <li key={u.actionId} data-action-id={u.actionId} data-level={u.level}>
                        {u.name}: {u.levelLabel}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
          <p>{t.noUpload}</p>
          <StepNav lang={lang} back={{ href: "/actions", label: t.back }} next={{ href: "/help", label: t.next }} />
        </>
      )}
    </>
  );
}
