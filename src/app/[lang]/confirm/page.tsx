import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { RequireSession } from "@/components/RequireSession";
import { ConfirmStep } from "@/components/steps/ConfirmStep";
import { getDictionary, isLocale } from "@/lib/i18n";

// Journey step 2: confirm or edit the facts entered in step 1.
export default async function ConfirmPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);

  return (
    <>
      <SiteHeader lang={lang} path="/confirm" />
      <RequireSession lang={lang} title={t.confirm.title}>
        <ConfirmStep lang={lang} />
      </RequireSession>
    </>
  );
}
