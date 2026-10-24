// Steps 3–6 content, keyboard, and print control. Fictional data only; nothing is submitted.
import { expect, test } from "@playwright/test";
import { EXPECTED_ORDER, LANGS, cardStructure, gotoStep } from "./helpers";

const TEXT = {
  en: {
    demoRule: "Demo rule, not verified against official policy",
    noDeadline: "No deadline shown. Ask a human helper about timing.",
    cantTell: "can't tell yet",
    missing: "Missing",
    legalAid: "Ask legal aid any questions about the notice.",
    print: "Print this summary",
    next: "Next: Documents to gather",
    unverified: "Unverified",
  },
  es: {
    demoRule: "Regla de demostración, no verificada con la política oficial",
    noDeadline: "No se muestra fecha límite. Pregunte a una persona que le ayude sobre los plazos.",
    cantTell: "todavía no se sabe",
    missing: "Faltan",
    legalAid: "Haga a la asistencia legal cualquier pregunta sobre el aviso.",
    print: "Imprimir este resumen",
    next: "Siguiente: Documentos que debe reunir",
    unverified: "Sin verificar",
  },
} as const;

for (const lang of LANGS) {
  const t = TEXT[lang];

  test.describe(`action plan (${lang})`, () => {
    test("three cards in graph order, each with five text dimensions and the demo-rule label", async ({ page }) => {
      await gotoStep(page, lang, "actions");
      await expect(page.locator("h1")).toBeFocused();
      const cards = page.locator("article.action-card");
      await expect(cards).toHaveCount(3);
      expect((await cardStructure(page)).map((c) => c.id)).toEqual(EXPECTED_ORDER);
      for (const card of await cards.all()) {
        await expect(card.locator("[data-dimension]")).toHaveCount(5);
        await expect(card.locator("[data-dimension] dt")).toHaveCount(5);
        await expect(card.getByText(t.demoRule)).toBeVisible();
        await expect(card.getByText(t.noDeadline)).toBeVisible();
        await expect(card.getByText(t.unverified, { exact: true })).toBeVisible();
      }
      // No external links for unreviewed sources, and no submit control.
      await expect(page.locator('main a[href^="http"]')).toHaveCount(0);
      await expect(page.locator("main form, main [type=submit]")).toHaveCount(0);
    });

    test("missing and unknown information stays visible", async ({ page }) => {
      await gotoStep(page, lang, "actions");
      const util = page.locator('article[data-action-id="A-UTIL"]');
      await expect(util).toHaveAttribute("data-status", "cant_tell");
      await expect(util).toHaveAttribute("data-fact-confirmation", "has_missing");
      await expect(util).toHaveAttribute("data-urgency", "unknown");
      await expect(util.getByRole("heading", { name: t.missing, exact: true })).toBeVisible();
      await expect(util.locator('[data-fact-id="received_shutoff_notice"]')).toBeVisible();
      await expect(util.getByText(t.cantTell).first()).toBeVisible();
    });

    test("documents list each document once and show reuse", async ({ page }) => {
      await gotoStep(page, lang, "documents");
      await expect(page.locator('[data-evidence-id="E-ID"]')).toHaveCount(1);
      await expect(page.locator('[data-evidence-id="E-ID"] [data-action-id]')).toHaveCount(3);
      await expect(page.locator('input[type="file"], [capture]')).toHaveCount(0);
    });

    test("help shows the can't-tell program, legal-aid notice, and three statements", async ({ page }) => {
      await gotoStep(page, lang, "help");
      await expect(page.locator('[data-program="utility"]')).toContainText(t.cantTell);
      await expect(page.locator('[data-notice="legal-aid"]')).toContainText(t.legalAid);
      await expect(page.locator("ul.statements li")).toHaveCount(3);
      await expect(page.locator("[data-help-option]")).toHaveCount(3);
    });

    test("handoff renders both language blocks and one keyboard-operable print control", async ({ page }) => {
      await page.addInitScript(() => {
        (window as unknown as { __printCalls: number }).__printCalls = 0;
        window.print = () => {
          (window as unknown as { __printCalls: number }).__printCalls += 1;
        };
      });
      await gotoStep(page, lang, "handoff");
      await expect(page.locator('section.handoff-block[lang="en"]')).toBeVisible();
      await expect(page.locator('section.handoff-block[lang="es"]')).toBeVisible();
      await expect(page.locator('section.handoff-block [data-fact-state="unknown"]')).toHaveCount(2);
      await expect(page.locator("main form, main [type=submit]")).toHaveCount(0);
      const print = page.getByRole("button", { name: t.print });
      await expect(page.locator("main button")).toHaveCount(1);
      await print.focus();
      await expect(print).toBeFocused();
      await page.keyboard.press("Enter");
      expect(await page.evaluate(() => (window as unknown as { __printCalls: number }).__printCalls)).toBe(1);
      // Generated-at date is a YYYY-MM-DD local date, identical in both blocks.
      const dates = await page.locator("[data-generated-at]").evaluateAll((els) => els.map((e) => e.getAttribute("datetime")));
      expect(dates).toHaveLength(2);
      expect(dates[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(dates[1]).toBe(dates[0]);
    });

    test("keyboard: Tab reaches the Next link and Enter moves to the next step with focus on its h1", async ({ page }) => {
      await gotoStep(page, lang, "actions");
      const next = page.getByRole("link", { name: t.next });
      for (let i = 0; i < 60 && !(await next.evaluate((el) => el === document.activeElement)); i++) {
        await page.keyboard.press("Tab");
      }
      await expect(next).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`/${lang}/documents$`));
      await expect(page.locator("h1")).toBeFocused();
    });
  });
}
