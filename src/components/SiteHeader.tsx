"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDictionary, locales, type Locale } from "@/lib/i18n";

interface Props {
  lang: Locale;
  /**
   * Deprecated: the current path now comes from usePathname(). Still accepted so existing
   * pages compile unchanged; it is used only as a fallback before the pathname is known.
   */
  path?: string;
}

/** Strips the leading "/en" or "/es" so the language switch keeps the same step. */
function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|es)(?=\/|$)/);
  return match ? pathname.slice(match[0].length) : pathname;
}

export function SiteHeader({ lang, path = "" }: Props) {
  const pathname = usePathname();
  const rest = pathname ? stripLocale(pathname) : path;
  const t = getDictionary(lang).common;
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href={`/${lang}`} className="brand">
          {t.appName}
        </Link>
        <nav aria-label={t.languageLabel}>
          <ul className="lang-list">
            {locales.map((l) => (
              <li key={l}>
                {/* Client-side navigation: no document reload, so in-memory answers survive (Req 12.4, 12.5). */}
                <Link
                  href={`/${l}${rest}`}
                  hrefLang={l}
                  lang={l}
                  aria-current={l === lang ? "page" : undefined}
                  className="lang-link"
                >
                  {getDictionary(l).common.languageName}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
