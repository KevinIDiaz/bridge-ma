import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { computeDeadline } from "@/lib/rules/deadline";
import type { EngineFacts, ReviewStatus, RuleVersion, Source } from "@/lib/rules/types";
import { NUM_RUNS } from "./arbitraries";

// Test-only fictional records. Not Massachusetts policy.
const arbStatus = fc.constantFrom<ReviewStatus>("reviewed", "unreviewed", "stale");
const arbDate = fc
  .date({ min: new Date("2000-01-01T00:00:00Z"), max: new Date("2099-12-31T00:00:00Z"), noInvalidDate: true })
  .map((d) => d.toISOString().slice(0, 10));
const arbFactState = fc.oneof(
  arbDate.map((date) => ({ state: "confirmed" as const, date })),
  fc.constant({ state: "unconfirmed" as const, date: "2026-01-15" }),
  fc.constant({ state: "unknown" as const, date: null }),
  fc.constant({ state: "absent" as const, date: null }),
);

describe("deadline calculator (property)", () => {
  // Feature: action-graph, Property 17: No deadline without a reviewed source
  it("Property 17: computed only with all-reviewed sources, a calculation, and a confirmed date", () => {
    fc.assert(
      fc.property(
        fc.array(arbStatus, { minLength: 1, maxLength: 3 }),
        fc.option(fc.integer({ min: 0, max: 400 }), { nil: null }),
        arbFactState,
        (statuses, offset, fact) => {
          const sources: Source[] = statuses.map((reviewStatus, i) => ({
            id: `S-${i}`,
            programId: "raft",
            publisher: "Fictional publisher",
            title: "Fictional source",
            url: reviewStatus === "reviewed" ? "https://example.org/fictional" : null,
            retrieved: reviewStatus === "reviewed" ? "2026-01-01" : null,
            reviewStatus,
          }));
          const rule: RuleVersion = {
            id: "R-TEST",
            version: 1,
            programId: "raft",
            sourceIds: sources.map((s) => s.id),
            synthetic: false,
            predicates: [{ id: "P", factId: "flag", op: "equals", value: true }],
            urgencyTriggerFactId: null,
            deadline: offset === null ? null : { kind: "offset_from_date_fact", factId: "d", offsetDays: offset },
          };
          const facts: EngineFacts = {
            confirmed: fact.state === "confirmed" ? { d: fact.date } : fact.state === "unknown" ? { d: "unknown" } : {},
            unconfirmedIds: fact.state === "unconfirmed" ? ["d"] : [],
          };

          const d = computeDeadline(rule, sources, facts);
          const allReviewed = statuses.every((s) => s === "reviewed");
          if (!allReviewed) expect(d).toEqual({ kind: "unknown", reason: "source_unreviewed" });
          else if (offset === null) expect(d).toEqual({ kind: "unknown", reason: "unsupported" });
          else if (fact.state !== "confirmed") expect(d).toEqual({ kind: "unknown", reason: "facts_unconfirmed" });
          else {
            const expected = new Date(Date.parse(`${fact.date}T00:00:00Z`) + offset * 86_400_000).toISOString().slice(0, 10);
            expect(d).toEqual({ kind: "computed", date: expected, ruleId: "R-TEST", sourceId: "S-0" });
          }
          if (d.kind === "computed") expect(allReviewed).toBe(true);
        },
      ),
      NUM_RUNS,
    );
  });
});
