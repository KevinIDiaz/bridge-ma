import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { ActionsStep } from "@/components/steps/ActionsStep";
import { isLocale } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <>
      <SiteHeader lang={lang} />
      <main id="main" tabIndex={-1} className="container step">
        <ActionsStep lang={lang} />
      </main>
    </>
  );
}