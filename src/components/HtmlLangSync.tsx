"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/i18n";

/** Keeps <html lang> in step with the URL locale after a client-side language switch (Req 12.6). */
export function HtmlLangSync({ lang }: { lang: Locale }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
