// Small presentational pieces shared by steps 3–6. No state, no evaluation.
import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import type { DimensionView, SourceView } from "@/lib/i18n/localize";

/** Shown instead of any result when the pipeline returned errors (Req 4.3, 5.12, 13.7). */
export function JourneyErrorNotice({ lang, children }: { lang: Locale; children?: ReactNode }) {
  return (
    <div className="notice" role="alert">
      <p>{getDictionary(lang).journey.error}</p>
      {children}
    </div>
  );
}

export function StepNav({
  lang,
  back,
  next,
}: {
  lang: Locale;
  back?: { href: string; label: string };
  next?: { href: string; label: string };
}) {
  return (
    <nav className="step-nav" aria-label={getDictionary(lang).journey.stepNav}>
      {back ? (
        <Link href={`/${lang}${back.href}`} className="button-secondary">
          {back.label}
        </Link>
      ) : null}
      {next ? (
        <Link href={`/${lang}${next.href}`} className="button-primary">
          {next.label}
        </Link>
      ) : null}
    </nav>
  );
}

/** Each dimension as its own text pair, never color alone (Req 6.5, 15.4). */
export function DimensionList({ dimensions }: { dimensions: DimensionView[] }) {
  return (
    <dl className="dimensions">
      {dimensions.map((d) => (
        <div key={d.name} className="dimension" data-dimension={d.name} data-value={d.value}>
          <dt>{d.label}</dt>
          <dd>{d.valueLabel}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Sources with publisher, title, and review status. Unverified sources are labeled and never linked. */
export function SourceList({ sources }: { sources: SourceView[] }) {
  return (
    <ul className="source-list">
      {sources.map((s) => (
        <li key={s.id} data-source-id={s.id} data-review-status={s.reviewStatus}>
          {s.url ? (
            <a href={s.url} className="portal-link" rel="noopener noreferrer" lang={s.lang}>
              {s.publisher}: {s.title}
            </a>
          ) : (
            <span lang={s.lang}>
              {s.publisher}: {s.title}
            </span>
          )}{" "}
          <span className="source-status">({s.freshnessLabel})</span>
          {s.unverifiedLabel ? (
            <>
              {" "}
              <strong className="badge badge-unverified">{s.unverifiedLabel}</strong>
            </>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
