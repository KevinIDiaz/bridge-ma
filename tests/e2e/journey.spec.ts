// Full six-step journey (task 7.1). Runs only on the integrated build (PRE_INTEGRATION = false).
import { expect, test } from "@playwright/test";
import { EXPECTED_ORDER, PRE_INTEGRATION, cardStructure, completeIntake, type Lang } from "./helpers";

const NEXT: Record<Lang, Record<"actions" | "documents" | "help" | "handoff", RegExp>> = {
  en: { actions: /next actions|actions/i, documents: /documents/i, help: /who can help/i, handoff: /print your summary/i },
  es: { actions: /acciones/i, documents: /documentos/i, help: /quién puede ayudar/i, handoff: /imprima su resumen/i },
};

test.describe("full journey", () => {
  test.skip(PRE_INTEGRATION, "Needs Teammate 1's intake/confirm and the Lead's evaluateBridge/useJourney");

  for (const lang of ["es", "en"] as const) {
    test(`demo story → confirm → actions → documents → help → handoff, keyboard only (${lang})`, async ({ page }) => {
      await completeIntake(page, lang);

      // Step 2 → 3 by keyboard.
      const toActions = page.locator(`main a[href="/${lang}/actions"]`).first();
      await toActions.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`/${lang}/actions$`));
      await expect(page.locator("h1")).toBeFocused();

      const cards = await cardStructure(page);
      expect(cards.map((c) => c.id)).toEqual(EXPECTED_ORDER);
      expect(cards.map((c) => c.status)).toEqual(["may_match", "may_match", "cant_tell"]);
      expect(cards.map((c) => c.urgency)).toEqual(["urgent", "standard", "unknown"]);
      expect(cards.every((c) => c.deadline === "unknown:source_unreviewed")).toBe(true);
      expect(cards[2].missing).toEqual(["received_shutoff_notice"]);
      expect(cards.flatMap((c) => c.edges)).toEqual(["A-RAFT>A-SNAP", "A-RAFT>A-UTIL"]);
      await expect(page.locator('main a[href^="http"]')).toHaveCount(0);

      for (const step of ["documents", "help", "handoff"] as const) {
        const link = page.getByRole("link", { name: NEXT[lang][step] }).last();
        await link.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(new RegExp(`/${lang}/${step}$`));
        await expect(page.locator("h1")).toBeFocused();
        if (step === "documents") {
          await expect(page.locator('[data-evidence-id="E-ID"] [data-action-id]')).toHaveCount(3);
        }
        if (step === "help") {
          await expect(page.locator('[data-program="utility"]')).toBeVisible();
          await expect(page.locator('[data-notice="legal-aid"]')).toBeVisible();
          await expect(page.locator("ul.statements li")).toHaveCount(3);
        }
        if (step === "handoff") {
          await expect(page.locator("section.handoff-block[lang]")).toHaveCount(2);
          await expect(page.locator('section.handoff-block [data-fact-state="unknown"]')).toHaveCount(2);
        }
      }
    });
  }
});
