"use client";

// Step 5: what is uncertain and who can help (Req 11). Help options by name only.
import { useMemo } from "react";
import { getDictionary, type Locale } from "@/lib/i18n";
import { localizeHelp } from "@/lib/i18n/localize";
import { NoSessionNotice, StepTitle, useJourneyState } from "./journeyAdapter";
import { JourneyErrorNotice, SourceList, StepNav } from "./StepParts";

export function HelpStep({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const t = dict.help;
  const state = useJourneyState();
  const view = useMemo(
    () => (state.kind === "ok" ? localizeHelp(dict, lang, state.result, state.fixture) : null),
    [state, dict, lang],
  );

  return (
    <>
      <p className="step-label">{t.stepLabel}</p>
      <StepTitle>{t.title}</StepTitle>
      {state.kind === "no_session" ? (
        <NoSessionNotice lang={lang} />
      ) : state.kind === "error" || !view ? (
        <JourneyErrorNotice lang={lang} />
      ) : (
        <>
          <section aria-labelledby="help-cant-tell">
            <h2 id="help-cant-tell">{t.cantTellTitle}</h2>
            {view.noneCantTell ? (
              <p>{view.noneCantTell}</p>
            ) : (
              <ul className="plain-list">
                {view.cantTell.map((p) => (
                  <li key={p.programId} data-program={p.programId} className="help-program">
                    <h3>
                      {p.name}: {dict.status.cant_tell}
                    </h3>
                    <p>
                      <strong>{t.missing}:</strong>{" "}
                      {p.missing.length > 0 ? p.missing.map((f) => f.label).join(", ") : t.none}
                    </p>
                    <p>
                      <strong>{t.unconfirmed}:</strong>{" "}
                      {p.unconfirmed.length > 0 ? p.unconfirmed.map((f) => f.label).join(", ") : t.none}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {view.legalAidNotice ? (
            <p className="notice" data-notice="legal-aid">
              {view.legalAidNotice}
            </p>
          ) : null}

          <section aria-labelledby="help-human">
            <h2 id="help-human">{t.humanHelpTitle}</h2>
            <p>{t.humanHelpIntro}</p>
            <ul>
              {view.humanHelp.map((h) => (
                <li key={h.option} data-help-option={h.option}>
                  {h.name}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="help-synthetic">
            <h2 id="help-synthetic">{t.syntheticTitle}</h2>
            <ul>
              {view.syntheticRules.map((r) => (
                <li key={r.ruleId} data-rule-id={r.ruleId} data-rule-version={r.ruleVersion}>
                  {r.text}: {dict.labels.syntheticRule}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="help-sources">
            <h2 id="help-sources">{t.sourcesTitle}</h2>
            {view.unreviewedSources.length > 0 ? (
              <SourceList sources={view.unreviewedSources} />
            ) : (
              <p>{t.noUnreviewedSources}</p>
            )}
          </section>

          <section aria-labelledby="help-statements">
            <h2 id="help-statements">{t.statementsTitle}</h2>
            <ul className="statements">
              {view.statements.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>

          <StepNav lang={lang} back={{ href: "/documents", label: t.back }} next={{ href: "/handoff", label: t.next }} />
        </>
      )}
    </>
  );
}
