// Privacy checks across steps 3–6 (Req 1.6, 14.2–14.5). Fictional data only.
import { expect, test } from "@playwright/test";
import { LANGS, PRE_INTEGRATION, buildPlan, completeIntake, followLinkTo } from "./helpers";

for (const lang of LANGS) {
  test(`no cookies, no storage, no third-party requests, no intake text sent (${lang})`, async ({ page, context, baseURL }) => {
    const requests: { url: string; body: string }[] = [];
    page.on("request", (r) => requests.push({ url: r.url(), body: r.postData() ?? "" }));

    if (PRE_INTEGRATION) {
      await page.goto(`/${lang}/actions`);
    } else {
      await completeIntake(page, lang);
      await buildPlan(page, lang);
    }
    await followLinkTo(page, lang, "handoff");

    expect(await context.cookies()).toEqual([]);
    const storage = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }));
    expect(storage).toEqual({ local: 0, session: 0 });

    const origin = new URL(baseURL!).origin;
    const thirdParty = requests.filter((r) => !r.url.startsWith(origin) && !r.url.startsWith("data:"));
    expect(thirdParty.map((r) => r.url)).toEqual([]);
    const storyPosts = requests.filter((r) => /Boston/i.test(r.body));
    expect(storyPosts.map((r) => new URL(r.url).pathname)).toEqual(["/api/assistant"]);
  });
}
