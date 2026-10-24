// Primary three-step demo journey. Fictional data only; no real agency submission.
import { expect, test } from "@playwright/test";
import { EXPECTED_ORDER, buildPlan, cardStructure, completeIntake } from "./helpers";

test.describe("three-step journey", () => {
  for (const lang of ["es", "en"] as const) {
    test(`story → one review → action plan → handoff (${lang})`, async ({ page }) => {
      await completeIntake(page, lang);
      await expect(page.locator("h1")).toBeFocused();
      await expect(page.locator("main [data-fact-id]")).toHaveCount(11);

      await buildPlan(page, lang);
      await expect(page.locator("h1")).toBeFocused();
      const cards = await cardStructure(page);
      expect(cards.map((card) => card.id)).toEqual(EXPECTED_ORDER);
      expect(cards.map((card) => card.status)).toEqual(["may_match", "may_match", "cant_tell"]);
      expect(cards.map((card) => card.sourceFreshness)).toEqual(["reviewed", "reviewed", "reviewed"]);
      expect(cards.every((card) => card.deadline === "unknown:unsupported")).toBe(true);
      expect(cards[2].missing).toEqual(["received_shutoff_notice"]);
      const officialUrls = await page.locator('main a[href^="https://www.mass.gov/"]').evaluateAll((links) =>
        [...new Set(links.map((link) => (link as HTMLAnchorElement).href))],
      );
      expect(officialUrls).toHaveLength(3);

      await page.getByRole("link", { name: /handoff|resumen bilingüe/i }).click();
      await expect(page).toHaveURL(new RegExp(`/${lang}/handoff$`));
      await expect(page.locator('section.handoff-block[lang="en"]')).toBeVisible();
      await expect(page.locator('section.handoff-block[lang="es"]')).toBeVisible();
    });
  }
});
