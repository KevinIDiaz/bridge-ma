"use client";

// Step 3: three action cards in graph order (Req 7). Presents the BridgeEvaluationResult as given.
import { useMemo } from "react";
import Link from "next/link";
import { ActionCard } from "@/components/ActionCard";
import { getDictionary, type Locale } from "@/lib/i18n";
import { localizeActionCards, localizeEvidence } from "@/lib/i18n/localize";
import { NoSessionNotice, StepTitle, useExplanations, useJourneyState } from "./journeyAdapter";
import { JourneyErrorNotice, StepNav } from "./StepParts";

export function ActionsStep({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const t = dict.actions;
  const state = useJourneyState(lang);
  const result = state.kind === "ok" ? state.result : null;
  const cards = useMemo(
    () => (state.kind === "ok" ? localizeActionCards(dict, lang, state.result, state.fixture) : []),
    [state, dict, lang],
  );
  const explanations = useExplanations(result, lang);
  const evidence = useMemo(
    () =>
      state.kind === "ok"
        ? localizeEvidence(dict, state.result.evidence, state.result.graph.nodes)
        : [],
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
          <div className="card-list">
            {cards.map((card) => (
              <ActionCard key={card.id} card={card} dict={dict} explanation={explanations[card.id]} />
            ))}
          </div>

          <section className="reusable-documents" aria-labelledby="documents-title">
            <p className="eyebrow">{dict.common.appName}</p>
            <h2 id="documents-title">{t.documentsTitle}</h2>
            <p>{t.documentsIntro}</p>
            <ul className="document-chip-list">
              {evidence.map((row) => (
                <li key={row.evidenceTypeId} data-evidence-id={row.evidenceTypeId}>
                  <strong>{row.label}</strong>
                  {row.reuseText ? <span>{row.reuseText}</span> : null}
                </li>
              ))}
            </ul>
            <Link href={`/${lang}/handoff`} className="button-primary">
              {t.printHandoff}
            </Link>
          </section>
          <StepNav
            lang={lang}
            back={{ href: "/confirm", label: t.back }}
          />
        </>
      )}
    </>
  );
}
