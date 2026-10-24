"use client";

import Link from "next/link";
import { getDictionary, type Locale } from "@/lib/i18n";
import { useSession } from "@/components/useSession";
import { StepHeading } from "@/components/StepHeading";

interface Props {
  lang: Locale;
  /** The step's heading text, shown in both the guarded and empty states. */
  title: string;
  children: React.ReactNode;
}

/**
 * Empty-session guard for steps 2–6. Session state lives only in memory and is
 * cleared on reload, so a direct load or reload of a later step has no facts.
 * In that case this renders only the heading, a dictionary message, and a link
 * back to step 1 — no card, evidence, or packet (Req 12.7, 14.2).
 */
export function RequireSession({ lang, title, children }: Props) {
  const { facts } = useSession();
  const t = getDictionary(lang).confirm;

  if (facts === null) {
    return (
      <main id="main" className="container">
        <StepHeading>{title}</StepHeading>
        <p>{t.noSession}</p>
        <Link href={`/${lang}/story`}>{t.goToStart}</Link>
      </main>
    );
  }

  return <>{children}</>;
}
