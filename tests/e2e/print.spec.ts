// Print view of the bilingual handoff (Req 13.5, 13.6).
import { expect, test } from "@playwright/test";
import { LANGS, gotoStep } from "./helpers";

for (const lang of LANGS) {
  test(`handoff print media hides chrome and keeps both blocks unclipped (${lang})`, async ({ page }) => {
    await gotoStep(page, lang, "handoff");
    await expect(page.locator("button.print-control")).toHaveCount(1);
    await expect(page.locator("button.print-control")).toBeVisible();

    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".site-header")).toBeHidden();
    await expect(page.locator(".lang-list")).toBeHidden();
    await expect(page.locator("button.print-control")).toBeHidden();
    await expect(page.locator(".site-footer")).toBeHidden();
    await expect(page.locator(".step-nav")).toBeHidden();
    await expect(page.locator('section.handoff-block[lang="en"]')).toBeVisible();
    await expect(page.locator('section.handoff-block[lang="es"]')).toBeVisible();

    // No element inside the handoff clips its text with overflow: hidden.
    const clipped = await page.locator("section.handoff-block").evaluateAll((blocks) =>
      blocks.flatMap((b) =>
        [b, ...b.querySelectorAll<HTMLElement>("*")]
          .filter((el) => {
            const s = getComputedStyle(el);
            const hides = [s.overflow, s.overflowX, s.overflowY].some((v) => v === "hidden" || v === "clip");
            return hides && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
          })
          .map((el) => el.tagName + (el.className ? `.${el.className}` : "")),
      ),
    );
    expect(clipped).toEqual([]);

    // Every dimension is still a text label in print.
    await expect(page.locator("section.handoff-block [data-dimension] dt").first()).toBeVisible();
  });
}
