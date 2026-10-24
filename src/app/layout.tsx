import type { ReactNode } from "react";
import "./globals.css";

// Static root layout (design D-035). It owns <html> so a language switch between /en and /es
// is a soft navigation inside the same root layout. HtmlLangSync updates lang afterwards.
const LANG_SCRIPT = `document.documentElement.lang=location.pathname.startsWith('/es')?'es':'en';`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Sets the correct lang before first paint on a direct load. */}
        <script dangerouslySetInnerHTML={{ __html: LANG_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
