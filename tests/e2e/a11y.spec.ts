// Automated accessibility checks (Req 15.3, 15.5, 15.6). axe is not full WCAG validation;
// manual screen-reader testing and expert review have not been done.
import { expect, test } from "@playwright/test";
import { LANGS, PRE_INTEGRATION, STEPS, axeViolations, completeIntake, gotoStep } from "./helpers";

for (const lang of LANGS) {
  for (const step of STEPS) {
    test(`axe, one h1, and no horizontal scroll at 320px: ${lang}/${step}`, async ({ page }, info) => {
      await gotoStep(page, lang, step);
      await expect(page.locator("h1")).toHaveCount(1);

      const violations = await axeViolations(page);
      info.annotations.push({ type: "axe-violations", description: `${lang}/${step} ${info.project.name}: ${violations.length}` });
      expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

      await page.setViewportSize({ width: 320, height: 800 });
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      const mobileViolations = await axeViolations(page);
      info.annotations.push({ type: "axe-violations-320", description: `${lang}/${step}: ${mobileViolations.length}` });
      expect(mobileViolations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }

  test.describe("integrated journey only", () => {
    test.skip(PRE_INTEGRATION, "Needs Teammate 1's intake/confirm");

    test(`axe and one h1 on the confirm step (${lang})`, async ({ page }, info) => {
      await completeIntake(page, lang);
      await expect(page.locator("h1")).toHaveCount(1);
      const violations = await axeViolations(page);
      info.annotations.push({ type: "axe-violations", description: `${lang}/confirm: ${violations.length}` });
      expect(violations).toEqual([]);
    });
  });
}
