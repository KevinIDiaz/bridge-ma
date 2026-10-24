import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { IntakeStep } from "@/components/steps/IntakeStep";
import { isLocale } from "@/lib/i18n";

// Journey step 1: fictional intake. The IntakeStep client component owns the form.
export default async function StoryPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <>
      <SiteHeader lang={lang} path="/story" />
      <IntakeStep lang={lang} />
    </>
  );
}
