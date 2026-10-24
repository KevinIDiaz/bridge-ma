import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { HtmlLangSync } from "@/components/HtmlLangSync";
import { getDictionary, isLocale, locales } from "@/lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

interface LangParams {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang).meta;
  return { title: t.title, description: t.description };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Nested layout per locale. <html> and <body> live in the static root layout (src/app/layout.tsx).
export default async function LangLayout({ children, params }: LangParams & { children: ReactNode }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang).common;

  return (
    <>
      <HtmlLangSync lang={lang} />
      <a className="skip-link" href="#main">
        {t.skipToContent}
      </a>
      {children}
      <footer className="site-footer">
        <div className="container">
          <p>{t.footer}</p>
        </div>
      </footer>
    </>
  );
}
