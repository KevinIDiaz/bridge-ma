import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getDictionary, isLocale } from "@/lib/i18n";

// Placeholder for journey step 1. Intake is intentionally not built yet.
export default async function StoryPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang).story;

  return (
    <>
      <SiteHeader lang={lang} path="/story" />
      <main id="main" tabIndex={-1} className="container">
        <p className="step-label">{t.stepLabel}</p>
        <h1>{t.title}</h1>
        <p>{t.notBuilt}</p>
        <Link href={`/${lang}`}>{t.back}</Link>
      </main>
    </>
  );
}
