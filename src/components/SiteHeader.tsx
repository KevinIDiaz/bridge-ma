import Link from "next/link";
import { getDictionary, locales, type Locale } from "@/lib/i18n";

interface Props {
  lang: Locale;
  /** Path after the locale segment, e.g. "" or "/story". Used so switching language keeps your place. */
  path: string;
}

export function SiteHeader({ lang, path }: Props) {
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
                {/* Plain <a> so the document reloads and <html lang> updates. */}
                <a
                  href={`/${l}${path}`}
                  hrefLang={l}
                  lang={l}
                  aria-current={l === lang ? "page" : undefined}
                  className="lang-link"
                >
                  {getDictionary(l).common.languageName}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
