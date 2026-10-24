// Language switching keeps the step, the in-memory state, and the structured outcome (Req 12.3–12.7).
import { expect, test } from "@playwright/test";
import { PRE_INTEGRATION, cardStructure, completeIntake, gotoStep } from "./helpers";

type MarkedWindow = Window & { __bridgeMarker?: number };

test("switching language on step 3 is a soft navigation and keeps IDs, decisions, dates, and graph", async ({ page }) => {
  await gotoStep(page, "en", "actions");
  const before = await cardStructure(page);
  expect(before).toHaveLength(3);
  await page.evaluate(() => {
    (window as MarkedWindow).__bridgeMarker = 1;
  });

  await page.getByRole("navigation", { name: "Language" }).getByRole("link", { name: "Español" }).click();
  await expect(page).toHaveURL(/\/es\/actions$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("heading", { level: 1, name: "Sus próximas acciones" })).toBeVisible();
  expect(await page.evaluate(() => (window as MarkedWindow).__bridgeMarker)).toBe(1);
  expect(await cardStructure(page)).toEqual(before);

  await page.getByRole("navigation", { name: "Idioma" }).getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/actions$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(await page.evaluate(() => (window as MarkedWindow).__bridgeMarker)).toBe(1);
  expect(await cardStructure(page)).toEqual(before);
});

test("switching language on the handoff keeps the generated-at date and action order", async ({ page }) => {
  await gotoStep(page, "es", "handoff");
  const read = () =>
    page.locator("section.handoff-block").evaluateAll((blocks) =>
      blocks.map((b) => ({
        lang: b.getAttribute("lang"),
        date: b.querySelector("[data-generated-at]")?.getAttribute("datetime"),
        actions: [...b.querySelectorAll<HTMLElement>("[data-action-id].action-summary")].map(
          (a) => `${a.dataset.actionId}:${a.dataset.status}:${a.dataset.deadline}`,
        ),
      })),
    );
  const before = await read();
  await page.getByRole("navigation", { name: "Idioma" }).getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/handoff$/);
  expect(await read()).toEqual(before);
});

test.describe("integrated journey only", () => {
  test.skip(PRE_INTEGRATION, "Needs Teammate 1's intake/confirm and the Lead's session-backed useJourney");

  test("switching language on /confirm keeps every fact value and confirmation state", async ({ page }) => {
    await completeIntake(page, "en");
    const facts = () =>
      page.locator("main [data-fact-id]").evaluateAll((rows) =>
        rows.map((r) => [(r as HTMLElement).dataset.factId, (r as HTMLElement).dataset.value, (r as HTMLElement).dataset.confirmation]),
      );
    const before = await facts();
    expect(before.length).toBeGreaterThan(0);
    await page.evaluate(() => {
      (window as MarkedWindow).__bridgeMarker = 1;
    });
    await page.getByRole("navigation", { name: "Language" }).getByRole("link", { name: "Español" }).click();
    await expect(page).toHaveURL(/\/es\/confirm$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    expect(await page.evaluate(() => (window as MarkedWindow).__bridgeMarker)).toBe(1);
    expect(await facts()).toEqual(before);
  });

  test("reloading step 3 shows the empty-session message and no cards", async ({ page }) => {
    await gotoStep(page, "en", "actions");
    await page.reload();
    await expect(page.locator("article.action-card")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /step 1/i })).toHaveAttribute("href", "/en/story");
  });
});
