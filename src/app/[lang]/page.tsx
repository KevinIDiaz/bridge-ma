import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function LandingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const t = dict.landing;

  return (
    <>
      <SiteHeader lang={lang} path="" />
      <main id="main" tabIndex={-1} className="container landing">
        <h1>{dict.common.appName}</h1>
        <p className="lede">{t.purpose}</p>
        <section className="notice" aria-labelledby="demo-notice-title">
          <h2 id="demo-notice-title">{t.disclosureTitle}</h2>
          <p>{t.disclosureBody}</p>
        </section>
        <Link href={`/${lang}/story`} className="button-primary">
          {t.start}
        </Link>
      </main>
    </>
  );
}
