"use client";

// Step 6: printable bilingual handoff (Req 13). The same HandoffPacket rendered twice,
// once with lang="en" and once with lang="es". One print control; nothing is sent anywhere.
import Link from "next/link";
import { useMemo } from "react";
import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { localizeHandoff, type HandoffBlockView } from "@/lib/i18n/localize";
import { NoSessionNotice, StepTitle, useJourneyState } from "./journeyAdapter";
import { DimensionList, JourneyErrorNotice, StepNav } from "./StepParts";

export function HandoffBlock({ block }: { block: HandoffBlockView }) {
  const t = getDictionary(block.lang).handoff;
  const id = (s: string) => `handoff-${block.lang}-${s}`;
  return (
    <section lang={block.lang} className="handoff-block" aria-labelledby={id("title")} data-lang={block.lang}>
      <p className="badge badge-fictional">{block.fictionalDemo}</p>
      <h2 id={id("title")}>{block.blockTitle}</h2>
      <p className="handoff-meta">
        <span data-fixture-version={block.fixtureVersion}>{block.fixtureVersionText}</span>
        {" · "}
        <time dateTime={block.generatedAt} data-generated-at={block.generatedAt}>
          {block.generatedAtText}
        </time>
      </p>

      <section aria-labelledby={id("confirmed")}>
        <h3 id={id("confirmed")}>{t.confirmedFacts}</h3>
        {block.confirmedFacts.length > 0 ? (
          <dl className="fact-list">
            {block.confirmedFacts.map((f) => (
              <div key={f.factId} data-fact-id={f.factId}>
                <dt>{f.label}</dt>
                <dd>{f.valueLabel}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>{t.noConfirmedFacts}</p>
        )}
      </section>

      <section aria-labelledby={id("unknown")}>
        <h3 id={id("unknown")}>{t.unknownFacts}</h3>
        {block.unknownFacts.length > 0 ? (
          <dl className="fact-list">
            {block.unknownFacts.map((f) => (
              <div key={f.factId} data-fact-id={f.factId} data-fact-state={f.state}>
                <dt>{f.label}</dt>
                <dd>{f.stateLabel}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>{t.noUnknownFacts}</p>
        )}
      </section>

      <section aria-labelledby={id("actions")}>
        <h3 id={id("actions")}>{t.actions}</h3>
        <ol className="handoff-actions">
          {block.actions.map((a) => (
            <li
              key={a.id}
              className="action-summary"
              data-action-id={a.id}
              data-status={a.status}
              data-rule-id={a.ruleId}
              data-rule-version={a.ruleVersion ?? ""}
              data-deadline={a.deadline.kind === "computed" ? a.deadline.date : `unknown:${a.deadline.reason}`}
            >
              <h4>{a.name}</h4>
              {a.syntheticLabel ? <p className="badge badge-synthetic">{a.syntheticLabel}</p> : null}
              <DimensionList dimensions={a.dimensions} />
              <p>{a.ruleLine}</p>
              <p>{a.deadlineText}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby={id("evidence")}>
        <h3 id={id("evidence")}>{t.evidence}</h3>
        <ul>
          {block.evidence.map((row) => (
            <li key={row.evidenceTypeId} data-evidence-id={row.evidenceTypeId}>
              <strong>{row.label}</strong>
              {row.syntheticLabel ? ` (${row.syntheticLabel})` : ""}:{" "}
              {row.uses.map((u) => `${u.name} (${u.levelLabel})`).join(", ")}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={id("targets")}>
        <h3 id={id("targets")}>{t.targets}</h3>
        <ul>
          {block.targets.map((h) => (
            <li key={h.actionId} data-action-id={h.actionId} data-handoff-kind={h.view.kind}>
              {h.name}:{" "}
              {h.view.url ? (
                <a href={h.view.url} className="portal-link" rel="noopener noreferrer">
                  {h.view.text}
                </a>
              ) : (
                h.view.text
              )}
            </li>
          ))}
        </ul>
      </section>

      <ul className="statements">
        {block.statements.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </section>
  );
}

export function HandoffStep({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).handoff;
  const state = useJourneyState();
  const blocks = useMemo(
    () =>
      state.kind === "ok"
        ? locales.map((l) => localizeHandoff(getDictionary(l), l, state.result.handoff, state.fixture))
        : [],
    [state],
  );

  return (
    <>
      <p className="step-label">{t.stepLabel}</p>
      <StepTitle>{t.title}</StepTitle>
      {state.kind === "no_session" ? (
        <NoSessionNotice lang={lang} />
      ) : state.kind === "error" ? (
        <JourneyErrorNotice lang={lang}>
          <p>
            <Link href={`/${lang}/confirm`}>{t.errorBackToConfirm}</Link>
          </p>
        </JourneyErrorNotice>
      ) : (
        <>
          <p>{t.intro}</p>
          <p>
            <button type="button" className="button-primary print-control" onClick={() => window.print()}>
              {t.print}
            </button>
          </p>
          {blocks.map((b) => (
            <HandoffBlock key={b.lang} block={b} />
          ))}
          <StepNav lang={lang} back={{ href: "/help", label: t.back }} />
        </>
      )}
    </>
  );
}
