import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("root redirects to the English landing page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1, name: "Bridge MA" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "This is a demo with fictional data" })).toBeVisible();
});

test("language selector switches to Spanish and keeps the page", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("navigation", { name: "Language" }).getByRole("link", { name: "Español" }).click();
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("link", { name: "Español" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { name: "Esta es una demostración con datos ficticios" })).toBeVisible();
});

test("Start goes to step 1 placeholder in the same language", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("link", { name: "Comenzar" }).click();
  await expect(page).toHaveURL(/\/es\/story$/);
  await expect(page.getByRole("heading", { level: 1, name: "Cuéntele a Bridge lo que está pasando" })).toBeVisible();
});

test("unsupported locale returns 404", async ({ page }) => {
  const res = await page.goto("/fr");
  expect(res?.status()).toBe(404);
});

for (const path of ["/en", "/es", "/en/story", "/es/story"]) {
  test(`no automated WCAG violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
}
