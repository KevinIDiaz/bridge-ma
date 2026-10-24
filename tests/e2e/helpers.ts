import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/**
 * true  = feature/action-plan-handoff before integration: steps 3–6 read a hand-written stub
 *         (src/components/steps/stubJourney.ts), so a direct page load shows the demo result.
 * false = integrated journey: answers live only in memory, so steps 3–6 are reached by doing
 *         the intake and confirmation first and then following in-app links.
 * The Lead flips this to false when merging intake + domain, which also enables the skipped specs.
 */
export const PRE_INTEGRATION = false;

export type Lang = "en" | "es";
export type Step = "actions" | "handoff";
export const STEPS: Step[] = ["actions", "handoff"];
export const LANGS: Lang[] = ["en", "es"];
export const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Display order of the demo persona's actions after every fact is confirmed (design "Expected demo outcome"). */
export const EXPECTED_ORDER = ["A-RAFT", "A-SNAP", "A-UTIL"];

/**
 * Accessible names in Teammate 1's intake/confirm UI. ASSUMPTION until intake merges:
 * verify these against the merged intake.* / confirm.* dictionary keys.
 */
const INTAKE_NAMES: Record<Lang, { demoFill: RegExp; review: RegExp; build: RegExp }> = {
  en: { demoFill: /fictional demo story/i, review: /review what bridge heard/i, build: /build my plan/i },
  es: { demoFill: /historia ficticia/i, review: /revisar lo que bridge entendió/i, build: /crear mi plan/i },
};

/** Step 1 → step 2: run the fictional story through the assistant and open review. */
export async function completeIntake(page: Page, lang: Lang) {
  await page.goto(`/${lang}/story`);
  await page.getByRole("button", { name: INTAKE_NAMES[lang].demoFill }).click();
  await page.getByRole("button", { name: INTAKE_NAMES[lang].review }).click();
  await expect(page).toHaveURL(new RegExp(`/${lang}/confirm$`));
}

export async function buildPlan(page: Page, lang: Lang) {
  await page.getByRole("button", { name: INTAKE_NAMES[lang].build }).click();
  await expect(page).toHaveURL(new RegExp(`/${lang}/actions$`));
}

/** Follows the in-app link to a step (client-side navigation keeps in-memory answers). */
export async function followLinkTo(page: Page, lang: Lang, step: Step) {
  await page.locator(`main a[href="/${lang}/${step}"]`).first().click();
  await expect(page).toHaveURL(new RegExp(`/${lang}/${step}$`));
}

/** Opens a step with the demo result available, in either build mode. */
export async function gotoStep(page: Page, lang: Lang, step: Step) {
  if (PRE_INTEGRATION) {
    await page.goto(`/${lang}/${step}`);
    return;
  }
  await completeIntake(page, lang);
  await buildPlan(page, lang);
  if (step === "actions") return;
  await followLinkTo(page, lang, "handoff");
}

export async function axeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations;
}

/** Structured outcome of every card, read from data attributes (locale-independent). */
export async function cardStructure(page: Page) {
  return page.locator("article.action-card").evaluateAll((cards) =>
    cards.map((c) => {
      const d = (c as HTMLElement).dataset;
      return {
        id: d.actionId,
        status: d.status,
        urgency: d.urgency,
        sourceFreshness: d.sourceFreshness,
        factConfirmation: d.factConfirmation,
        explanationOrigin: d.explanationOrigin,
        ruleId: d.ruleId,
        ruleVersion: d.ruleVersion,
        fixtureVersion: d.fixtureVersion,
        deadline: d.deadline,
        edges: [...c.querySelectorAll<HTMLElement>("[data-edge]")].map((e) => e.dataset.edge),
        missing: [...c.querySelectorAll<HTMLElement>('[data-fact-group="missing"] [data-fact-id]')].map((e) => e.dataset.factId),
        evidence: [...c.querySelectorAll<HTMLElement>("[data-evidence-id]")].map((e) => `${e.dataset.evidenceId}:${e.dataset.level}`),
      };
    }),
  );
}
