import { describe, expect, it } from "vitest";
import { STUB_FIXTURE, STUB_RESULT } from "@/components/steps/stubJourney";
import { getDictionary, locales } from "@/lib/i18n";
import {
  deadlineText,
  factValueLabel,
  format,
  localizeActionCards,
  localizeEvidence,
  localizeHandoff,
  localizeHelp,
  t,
} from "@/lib/i18n/localize";
import type { BridgeEvaluationResult, Fixture } from "@/lib/rules/types";

const en = getDictionary("en");
const es = getDictionary("es");

type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };
const clone = <T>(v: T) => structuredClone(v) as Mutable<T>;

function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  return Object.entries(obj).reduce<Record<string, string>>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") Object.assign(acc, flatten(v as Record<string, unknown>, key));
    else acc[key] = String(v);
    return acc;
  }, {});
}

describe("dictionary helpers", () => {
  it("t() returns the key when it is absent, so a gap is visible", () => {
    expect(t(en, "status.may_match")).toBe("may match");
    expect(t(en, "no.such.key")).toBe("no.such.key");
  });

  it("format() fills placeholders and leaves unknown ones visible", () => {
    expect(format("Rule {ruleId} v{v} {x}", { ruleId: "R-SNAP", v: 1 })).toBe("Rule R-SNAP v1 {x}");
  });
});

describe("labels", () => {
  it.each(locales)("%s has three distinct MatchStatus labels", (l) => {
    const d = getDictionary(l);
    const labels = new Set([d.status.may_match, d.status.likely_not, d.status.cant_tell]);
    expect(labels.size).toBe(3);
  });

  it.each(locales)("%s renders true, false, and unknown as three different fact values", (l) => {
    const d = getDictionary(l);
    const labels = [true, false, "unknown"].map((value) => factValueLabel(d, { id: "rents_home", value: value as boolean }));
    expect(new Set(labels).size).toBe(3);
  });
});

describe("dictionary content safety (Req 7.7, 11.5)", () => {
  const forbidden = /eligible|qualif|approved|guarantee|elegible|califica|aprobad|garantiz/i;
  const ntq = /notice to quit|aviso de desalojo/i;
  const validity = /\b(valid|invalid|enforceable|defective)\b|v[aá]lid|inv[aá]lid|exigible|defectuos/i;

  it.each(locales)("%s never states eligibility, approval, or a guarantee", (l) => {
    for (const [key, value] of Object.entries(flatten(getDictionary(l)))) {
      expect(forbidden.test(value), `${l}:${key} = ${value}`).toBe(false);
    }
  });

  it.each(locales)("%s never comments on Notice to Quit validity, except the required disclaimer", (l) => {
    for (const [key, value] of Object.entries(flatten(getDictionary(l)))) {
      if (key === "statements.noNtqAssessment") continue;
      if (ntq.test(value)) expect(validity.test(value), `${l}:${key} = ${value}`).toBe(false);
    }
  });
});

describe("action cards from the demo result", () => {
  const cards = localizeActionCards(en, "en", STUB_RESULT, STUB_FIXTURE);

  it("renders three cards in graph order", () => {
    expect(cards.map((c) => c.id)).toEqual(["A-RAFT", "A-SNAP", "A-UTIL"]);
  });

  it("keeps the missing fact visible and does not show the none-missing statement", () => {
    const util = cards[2];
    expect(util.missingFactIds).toEqual(["received_shutoff_notice"]);
    expect(util.missing.map((f) => f.factId)).toEqual(["received_shutoff_notice"]);
    expect(util.noneMissing).toBeNull();
    expect(util.factConfirmation).toBe("has_missing");
    expect(util.statusLabel).toBe("can't tell yet");
    expect(util.dimensions.find((d) => d.name === "urgency")?.valueLabel).toBe("Unknown");
  });

  it("shows the none-missing statement instead of empty lists", () => {
    expect(cards[0].noneMissing).toBe(en.actions.noneMissing);
    expect(cards[0].missing).toEqual([]);
    expect(cards[0].unconfirmed).toEqual([]);
  });

  it("lists unconfirmed facts under their own heading, separate from missing", () => {
    const r = clone(STUB_RESULT);
    r.evaluations[0].unconfirmedFactIds = ["lost_job_recently"];
    r.graph.nodes[1].factConfirmation = "has_unconfirmed";
    const snap = localizeActionCards(en, "en", r as BridgeEvaluationResult, STUB_FIXTURE)[1];
    expect(snap.unconfirmed.map((f) => f.factId)).toEqual(["lost_job_recently"]);
    expect(snap.missing).toEqual([]);
    expect(snap.noneMissing).toBeNull();
  });

  it("shows five separate dimensions, the rule line, why, one next step, and one handoff", () => {
    const raft = cards[0];
    expect(raft.dimensions.map((d) => d.name)).toEqual([
      "status",
      "urgency",
      "sourceFreshness",
      "factConfirmation",
      "explanationOrigin",
    ]);
    expect(raft.ruleLine).toBe("Rule R-RAFT, version 1, fixture version 2");
    expect(raft.why).toBe(en.reason["R-RAFT"].may_match);
    expect(raft.nextStep).toBe(en.nextStep.raft);
    expect(raft.handoff).toMatchObject({ kind: "human", text: "Legal aid", url: null });
    expect(raft.syntheticLabel).toBe(en.labels.syntheticRule);
    expect(raft.order).toEqual([]);
    expect(cards[1].order.map((o) => o.from)).toEqual(["A-RAFT"]);
  });

  it("names the other actions that reuse a document", () => {
    const id = cards[0].evidence.find((e) => e.evidenceTypeId === "E-ID");
    expect(id?.reusedBy.map((r) => r.actionId)).toEqual(["A-SNAP", "A-UTIL"]);
    expect(id?.reuseText).toBe("Also used for: SNAP food benefits, Utility shutoff protection");
  });

  it("shows the no-deadline text for an unknown deadline and the date with rule and source when computed", () => {
    expect(cards[0].deadlineText).toBe(en.deadline.unknown);
    expect(cards[0].deadlineText).not.toMatch(/\d/);
    expect(deadlineText(en, { kind: "computed", date: "2026-11-02", ruleId: "R-X", sourceId: "S-X" })).toBe(
      "2026-11-02 (rule R-X, source S-X)",
    );
  });
});

describe("stale and unverified sources are not presented as authoritative", () => {
  it("labels an unreviewed or stale source as unverified and never links it, even when it has a URL", () => {
    for (const status of ["unreviewed", "stale"] as const) {
      const fx = clone(STUB_FIXTURE);
      fx.sources[1].reviewStatus = status;
      fx.sources[1].url = "https://example.org/not-reviewed";
      const r = clone(STUB_RESULT);
      r.graph.nodes[0].sourceFreshness = status;
      const raft = localizeActionCards(en, "en", r as BridgeEvaluationResult, fx as Fixture)[0];
      expect(raft.sources[0]).toMatchObject({ unverified: true, url: null, unverifiedLabel: "Unverified" });
      expect(raft.handoff.url).toBeNull();
    }
  });

  it("links a portal only when the domain chose a portal target from a reviewed source", () => {
    const fx = clone(STUB_FIXTURE);
    fx.sources[1] = { ...fx.sources[1], reviewStatus: "reviewed", url: "https://example.org/raft", retrieved: "2026-10-24" };
    const r = clone(STUB_RESULT);
    r.graph.nodes[0].sourceFreshness = "reviewed";
    r.graph.nodes[0].handoff = { kind: "portal", sourceId: "S-RAFT-01", url: "https://example.org/raft", publisher: "Publisher X" };
    const raft = localizeActionCards(en, "en", r as BridgeEvaluationResult, fx as Fixture)[0];
    expect(raft.sources[0]).toMatchObject({ unverified: false, url: "https://example.org/raft", unverifiedLabel: null });
    expect(raft.handoff).toMatchObject({ kind: "portal", url: "https://example.org/raft" });
    expect(raft.handoff.text).toBe("Publisher X (external official page)");
  });

  it("marks English source text with lang=en on Spanish pages", () => {
    const cardsEs = localizeActionCards(es, "es", STUB_RESULT, STUB_FIXTURE);
    expect(cardsEs[0].sources[0].lang).toBe("en");
    expect(localizeActionCards(en, "en", STUB_RESULT, STUB_FIXTURE)[0].sources[0].lang).toBeUndefined();
  });
});

describe("evidence view", () => {
  it("lists each document once, in the domain's order, with every action and level", () => {
    const rows = localizeEvidence(en, STUB_RESULT.evidence, STUB_RESULT.graph.nodes);
    expect(rows.map((r) => r.evidenceTypeId)).toEqual(["E-ID", "E-NTQ", "E-LEASE", "E-JOB-LOSS", "E-HOUSEHOLD", "E-UTIL-BILL"]);
    const id = rows[0];
    expect(id.uses.map((u) => [u.actionId, u.level])).toEqual([
      ["A-RAFT", "required"],
      ["A-SNAP", "required"],
      ["A-UTIL", "required"],
    ]);
    expect(id.reused).toBe(true);
    expect(id.reuseText).toBe("Used for 3 actions. Gather it once.");
    expect(id.syntheticLabel).toBe(en.labels.syntheticRule);
  });
});

describe("help view", () => {
  it("lists the can't-tell program with its missing fact, synthetic rules, sources, help options, and statements", () => {
    const v = localizeHelp(en, "en", STUB_RESULT, STUB_FIXTURE);
    expect(v.cantTell.map((p) => p.programId)).toEqual(["utility"]);
    expect(v.cantTell[0].missing.map((f) => f.factId)).toEqual(["received_shutoff_notice"]);
    expect(v.noneCantTell).toBeNull();
    expect(v.syntheticRules.map((r) => `${r.ruleId}@${r.ruleVersion}`)).toEqual(["R-SNAP@1", "R-RAFT@1", "R-UTIL@1"]);
    expect(v.unreviewedSources.map((s) => s.id)).toEqual(["S-RAFT-01", "S-SNAP-01", "S-UTIL-01"]);
    expect(v.humanHelp.map((h) => h.name)).toEqual(["Legal aid", "Program office", "General help line"]);
    expect(v.legalAidNotice).toBe(en.help.legalAidNotice);
    expect(v.statements).toHaveLength(3);
  });

  it("says no program is can't-tell when none is, and still shows the other content", () => {
    const r = clone(STUB_RESULT);
    r.evaluations[2].status = "may_match";
    r.evaluations[2].missingFactIds = [];
    const v = localizeHelp(en, "en", r as BridgeEvaluationResult, STUB_FIXTURE);
    expect(v.cantTell).toEqual([]);
    expect(v.noneCantTell).toBe(en.help.noneCantTell);
    expect(v.humanHelp).toHaveLength(3);
    expect(v.statements).toHaveLength(3);
    expect(v.syntheticRules).toHaveLength(3);
  });

  it("shows the legal-aid notice only when the Notice to Quit is confirmed true", () => {
    const r = clone(STUB_RESULT);
    const ntq = r.facts.find((f) => f.id === "received_notice_to_quit")!;
    ntq.confirmation = "unconfirmed";
    expect(localizeHelp(en, "en", r as BridgeEvaluationResult, STUB_FIXTURE).legalAidNotice).toBeNull();
    ntq.confirmation = "confirmed";
    ntq.value = "unknown";
    expect(localizeHelp(en, "en", r as BridgeEvaluationResult, STUB_FIXTURE).legalAidNotice).toBeNull();
  });
});

describe("handoff blocks", () => {
  it("shows the unknown fact as unknown, never as No/false", () => {
    for (const l of locales) {
      const d = getDictionary(l);
      const b = localizeHandoff(d, l, STUB_RESULT.handoff, STUB_FIXTURE);
      const u = b.unknownFacts.find((f) => f.factId === "received_shutoff_notice");
      expect(u?.state).toBe("unknown");
      expect(u?.stateLabel).toBe(d.handoff.factState.unknown);
      expect(b.confirmedFacts.some((f) => f.factId === "received_shutoff_notice")).toBe(false);
      expect(b.actions.every((a) => a.deadlineText === d.deadline.unknown)).toBe(true);
      expect(b.statements).toHaveLength(3);
      expect(b.fictionalDemo).toBe(d.labels.fictionalDemo);
    }
  });

  it("keeps IDs, statuses, dimensions, versions, dates, and order identical in both languages", () => {
    const [a, b] = locales.map((l) => localizeHandoff(getDictionary(l), l, STUB_RESULT.handoff, STUB_FIXTURE));
    const structure = (x: typeof a) => ({
      actions: x.actions.map((n) => [n.id, n.status, n.ruleId, n.ruleVersion, n.deadline, n.dimensions.map((d) => d.value)]),
      confirmed: x.confirmedFacts.map((f) => [f.factId, f.value]),
      unknown: x.unknownFacts.map((f) => [f.factId, f.state]),
      evidence: x.evidence.map((e) => [e.evidenceTypeId, e.uses.map((u) => [u.actionId, u.level])]),
      targets: x.targets.map((h) => [h.actionId, h.view.target]),
      fixtureVersion: x.fixtureVersion,
      generatedAt: x.generatedAt,
    });
    expect(structure(b)).toEqual(structure(a));
    expect(b.blockTitle).not.toBe(a.blockTitle);
  });
});
