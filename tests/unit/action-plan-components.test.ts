// Component tests: server-render the presentational components to HTML (no DOM library needed).
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionCard } from "@/components/ActionCard";
import { HandoffBlock } from "@/components/steps/HandoffStep";
import { STUB_FIXTURE, STUB_RESULT } from "@/components/steps/stubJourney";
import { getDictionary, locales } from "@/lib/i18n";
import { localizeActionCards, localizeHandoff } from "@/lib/i18n/localize";

const en = getDictionary("en");
const cards = localizeActionCards(en, "en", STUB_RESULT, STUB_FIXTURE);
const render = (card = cards[2], explanation?: { text: string; origin: "rule_based" | "generated" }) =>
  renderToStaticMarkup(createElement(ActionCard, { card, dict: en, explanation }));

describe("ActionCard", () => {
  it("shows every dimension as its own text pair", () => {
    const html = render();
    for (const name of ["status", "urgency", "sourceFreshness", "factConfirmation", "explanationOrigin"]) {
      expect(html).toContain(`data-dimension="${name}"`);
    }
    expect(html).toContain("<dt>Urgency</dt><dd>Unknown</dd>");
  });

  it("keeps missing information visible under a Missing heading", () => {
    const html = render();
    expect(html).toContain('data-fact-group="missing"');
    expect(html).toContain("<h4>Missing</h4>");
    expect(html).toContain('data-fact-id="received_shutoff_notice"');
  });

  it("shows the rule-based result region, the demo-rule label, the no-deadline text, and an unverified source", () => {
    const html = render();
    expect(html).toContain("<h3>Rule-based result</h3>");
    expect(html).toContain("Rule R-UTIL, version 1, fixture version 2");
    expect(html).toContain(en.labels.syntheticRule);
    expect(html).toContain(en.deadline.unknown);
    expect(html).toContain('data-review-status="unreviewed"');
    expect(html).toContain(">Unverified<");
  });

  it("renders no links when no source is reviewed", () => {
    for (const card of cards) expect(render(card)).not.toMatch(/<a\s/);
  });

  it("labels the explanation by origin and renders its text as escaped plain text, capped at 600 characters", () => {
    const html = render(cards[0], { text: '<a href="https://x.test">click</a>' + "x".repeat(700), origin: "rule_based" });
    expect(html).toContain("What this means");
    expect(html).not.toContain('<a href="https://x.test">');
    expect(html).toContain("&lt;a href=");
    const text = html.match(/<section class="explanation"[^>]*>.*?<p>(.*?)<\/p>/)?.[1] ?? "";
    const decoded = text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    expect(decoded.length).toBe(600);
    expect(render(cards[0], { text: "t", origin: "generated" })).toContain("Personalized plain-language explanation");
  });
});

describe("HandoffBlock", () => {
  const html = locales.map((l) =>
    renderToStaticMarkup(createElement(HandoffBlock, { block: localizeHandoff(getDictionary(l), l, STUB_RESULT.handoff, STUB_FIXTURE) })),
  );

  it("renders one block per language with its lang attribute and the fictional-demo label first", () => {
    expect(html[0]).toMatch(/^<section lang="en" class="handoff-block"/);
    expect(html[1]).toMatch(/^<section lang="es" class="handoff-block"/);
    expect(html[0]).toContain("Fictional demo");
    expect(html[1]).toContain("Demostración ficticia");
  });

  it("keeps the same action order, statuses, and deadline kinds in both blocks", () => {
    const attrs = (h: string) => [...h.matchAll(/data-action-id="([^"]+)" data-status="([^"]+)"[^>]*data-deadline="([^"]+)"/g)].map((m) => m.slice(1));
    expect(attrs(html[0])).toEqual([
      ["A-RAFT", "may_match", "unknown:source_unreviewed"],
      ["A-SNAP", "may_match", "unknown:source_unreviewed"],
      ["A-UTIL", "cant_tell", "unknown:source_unreviewed"],
    ]);
    expect(attrs(html[1])).toEqual(attrs(html[0]));
  });

  it("lists the unknown fact with state unknown and has no submit or send control", () => {
    for (const h of html) {
      expect(h).toContain('data-fact-state="unknown"');
      expect(h).not.toMatch(/<form|<button|type="submit"/);
    }
  });
});
