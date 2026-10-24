// One recommendation card (Req 7). Renders a view model from localizeActionCard; decides nothing.
import type { ActionCardView } from "@/lib/i18n/localize";
import type { Dictionary } from "@/lib/i18n";
import type { Explanation } from "@/lib/rules/types";
import { DimensionList, SourceList } from "./steps/StepParts";

const EXPLANATION_MAX = 600;

export function ActionCard({
  card,
  dict,
  explanation,
}: {
  card: ActionCardView;
  dict: Dictionary;
  explanation?: Explanation;
}) {
  const t = dict.actions;
  const headingId = `card-${card.id}-title`;
  return (
    <article
      className="action-card"
      aria-labelledby={headingId}
      data-action-id={card.id}
      data-program={card.programId}
      data-status={card.status}
      data-urgency={card.urgency}
      data-source-freshness={card.sourceFreshness}
      data-fact-confirmation={card.factConfirmation}
      data-explanation-origin={card.explanationOrigin}
      data-rule-id={card.ruleId}
      data-rule-version={card.ruleVersion}
      data-fixture-version={card.fixtureVersion}
      data-deadline={card.deadline.kind === "computed" ? card.deadline.date : `unknown:${card.deadline.reason}`}
    >
      <h2 id={headingId}>{card.title}</h2>
      {card.syntheticLabel ? <p className="badge badge-synthetic">{card.syntheticLabel}</p> : null}

      <section className="rule-result" aria-label={card.ruleBasedLabel}>
        <h3>{card.ruleBasedLabel}</h3>
        <p className="status-line">
          <strong>{card.statusLabel}</strong>
        </p>
        <p className="rule-line">{card.ruleLine}</p>
        <p className="deadline-line">
          {t.deadline}: {card.deadlineText}
        </p>
      </section>

      <DimensionList dimensions={card.dimensions} />

      <section>
        <h3>{t.why}</h3>
        <p>{card.why}</p>
      </section>

      {explanation ? (
        <section className="explanation" data-origin={explanation.origin}>
          <h3>{explanation.origin === "generated" ? dict.explanation.generated : dict.explanation.ruleBased}</h3>
          {/* Plain text child only: React escapes it, so no markup or links come from it (Req 8.6). */}
          <p>{explanation.text.slice(0, EXPLANATION_MAX)}</p>
        </section>
      ) : null}

      <section>
        <h3>{t.facts}</h3>
        {card.noneMissing ? (
          <p>{card.noneMissing}</p>
        ) : (
          <>
            {card.missing.length > 0 ? (
              <div className="fact-group" data-fact-group="missing">
                <h4>{t.missing}</h4>
                <ul>
                  {card.missing.map((f) => (
                    <li key={f.factId} data-fact-id={f.factId}>
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {card.unconfirmed.length > 0 ? (
              <div className="fact-group" data-fact-group="unconfirmed">
                <h4>{t.unconfirmed}</h4>
                <ul>
                  {card.unconfirmed.map((f) => (
                    <li key={f.factId} data-fact-id={f.factId}>
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="next-step">
        <h3>{t.nextStep}</h3>
        <p>{card.nextStep}</p>
      </section>

      {card.order.length > 0 ? (
        <section>
          <h3>{t.order}</h3>
          <ul>
            {card.order.map((o) => (
              <li key={o.from} data-edge={`${o.from}>${card.id}`}>
                {o.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h3>{t.handoff}</h3>
        <p data-handoff-kind={card.handoff.kind}>
          {card.handoff.url ? (
            <a href={card.handoff.url} className="portal-link" rel="noopener noreferrer">
              {card.handoff.text}
            </a>
          ) : (
            card.handoff.text
          )}
        </p>
      </section>

      <section>
        <h3>{t.evidence}</h3>
        <ul className="evidence-list">
          {card.evidence.map((e) => (
            <li key={e.evidenceTypeId} data-evidence-id={e.evidenceTypeId} data-level={e.level}>
              <strong>{e.label}</strong> ({e.levelLabel}). {e.reuseText}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>{t.sources}</h3>
        <SourceList sources={card.sources} />
      </section>
    </article>
  );
}
