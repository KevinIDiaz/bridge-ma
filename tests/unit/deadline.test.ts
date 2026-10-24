import { describe, expect, it } from "vitest";
import { computeDeadline } from "@/lib/rules/deadline";
import type { EngineFacts, RuleVersion, Source } from "@/lib/rules/types";

// Test-only fictional records. Not Massachusetts policy.
const reviewed: Source = {
  id: "S-TEST",
  programId: "raft",
  publisher: "Fictional publisher",
  title: "Fictional reviewed source",
  url: "https://example.org/fictional",
  retrieved: "2026-01-01",
  reviewStatus: "reviewed",
};
const rule = (over: Partial<RuleVersion> = {}): RuleVersion => ({
  id: "R-TEST",
  version: 1,
  programId: "raft",
  sourceIds: ["S-TEST"],
  synthetic: false,
  predicates: [{ id: "P", factId: "flag", op: "equals", value: true }],
  urgencyTriggerFactId: null,
  deadline: { kind: "offset_from_date_fact", factId: "notice_date", offsetDays: 10 },
  ...over,
});
const facts = (date: string | null, unconfirmed = false): EngineFacts => ({
  confirmed: date === null || unconfirmed ? {} : { notice_date: date },
  unconfirmedIds: unconfirmed ? ["notice_date"] : [],
});

describe("computeDeadline", () => {
  it("source_unreviewed when any cited source is not reviewed (highest precedence)", () => {
    const d = computeDeadline(rule({ deadline: null }), [{ ...reviewed, reviewStatus: "stale" }], facts(null));
    expect(d).toEqual({ kind: "unknown", reason: "source_unreviewed" });
  });

  it("unsupported when the rule has no deadline calculation", () => {
    expect(computeDeadline(rule({ deadline: null }), [reviewed], facts(null))).toEqual({ kind: "unknown", reason: "unsupported" });
  });

  it("facts_unconfirmed when the date fact is unconfirmed, missing, or invalid", () => {
    expect(computeDeadline(rule(), [reviewed], facts("2026-03-01", true))).toEqual({ kind: "unknown", reason: "facts_unconfirmed" });
    expect(computeDeadline(rule(), [reviewed], facts(null))).toEqual({ kind: "unknown", reason: "facts_unconfirmed" });
    expect(computeDeadline(rule(), [reviewed], facts("2026-02-30"))).toEqual({ kind: "unknown", reason: "facts_unconfirmed" });
  });

  it("computes the date from a reviewed rule and a confirmed date (UTC)", () => {
    expect(computeDeadline(rule(), [reviewed], facts("2026-02-25"))).toEqual({
      kind: "computed",
      date: "2026-03-07",
      ruleId: "R-TEST",
      sourceId: "S-TEST",
    });
  });
});
