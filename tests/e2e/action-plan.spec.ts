import { expect, test } from "@playwright/test";
import { EXPECTED_ORDER, LANGS, cardStructure, gotoStep } from "./helpers";

const TEXT = {
  en: {
    demoRule: "Demo rule, not verified against official policy",
    noDeadline: "No deadline shown. Ask a human helper about timing.",
    cantTell: "can't tell yet",
    missing: "Missing",
    details: "How Bridge reached this result",
    print: "Print this summary",
    handoff: "Open bilingual handoff and print",
  },
  es: {
    demoRule: "Regla de demostración, no verificada con la política oficial",
    noDeadline: "No se muestra fecha límite. Pregunte a una persona que le ayude sobre los plazos.",
    cantTell: "todavía no se sabe",
    missing: "Faltan",
    details: "Cómo llegó Bridge a este resultado",
    print: "Imprimir este resumen",
    handoff: "Abrir resumen bilingüe e imprimir",
  },
} as const;

for (const lang of LANGS) {
  const t = TEXT[lang];

  test.describe(`action plan (${lang})`, () => {
    test("three simple cards preserve auditable detail and official sources", async ({ page }) => {
      await gotoStep(page, lang, "actions");
      await expect(page.locator("h1")).toBeFocused();
      const cards = page.locator("article.action-card");
      await expect(cards).toHaveCount(3);
      expect((await cardStructure(page)).map((card) => card.id)).toEqual(EXPECTED_ORDER);
      for (const card of await cards.all()) {
        await expect(card.getByText(t.demoRule)).toBeVisible();
        await card.locator("summary").click();
        await expect(card.locator("[data-dimension]")).toHaveCount(5);
        await expect(card.getByText(t.noDeadline)).toBeVisible();
        await expect(card.locator('a[href^="https://www.mass.gov/"]')).toHaveCount(2);
      }
      await expect(page.locator("main form, main [type=submit]")).toHaveCount(0);
    });

    test("missing and unknown information stays visible", async ({ page }) => {
      await gotoStep(page, lang, "actions");
      const util = page.locator('article[data-action-id="A-UTIL"]');
      await expect(util).toHaveAttribute("data-status", "cant_tell");
      await expect(util).toHaveAttribute("data-fact-confirmation", "has_missing");
      await expect(util).toHaveAttribute("data-urgency", "unknown");
      await util.locator("summary").click();
      await expect(util.getByRole("heading", { name: t.missing, exact: true })).toBeVisible();
      await expect(util.locator('[data-fact-id="received_shutoff_notice"]')).toBeVisible();
      await expect(util.getByText(t.cantTell).first()).toBeVisible();
    });

    test("reusable checklist shows every document once", async ({ page }) => {
      await gotoStep(page, lang, "actions");
      await expect(page.locator('.reusable-documents [data-evidence-id="E-ID"]')).toHaveCount(1);
      await expect(page.locator('.reusable-documents [data-evidence-id="E-JOB-LOSS"]')).toHaveCount(1);
      await expect(page.locator('input[type="file"], [capture]')).toHaveCount(0);
    });

    test("handoff renders both languages and a keyboard-operable print control", async ({ page }) => {
      await page.addInitScript(() => {
        (window as unknown as { __printCalls: number }).__printCalls = 0;
        window.print = () => {
          (window as unknown as { __printCalls: number }).__printCalls += 1;
        };
      });
      await gotoStep(page, lang, "handoff");
      await expect(page.locator('section.handoff-block[lang="en"]')).toBeVisible();
      await expect(page.locator('section.handoff-block[lang="es"]')).toBeVisible();
      const print = page.getByRole("button", { name: t.print });
      await print.focus();
      await page.keyboard.press("Enter");
      expect(await page.evaluate(() => (window as unknown as { __printCalls: number }).__printCalls)).toBe(1);
    });

    test("keyboard reaches the bilingual handoff", async ({ page }) => {
      await gotoStep(page, lang, "actions");
      const next = page.getByRole("link", { name: t.handoff });
      await next.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`/${lang}/handoff$`));
      await expect(page.locator("h1")).toBeFocused();
    });
  });
}
