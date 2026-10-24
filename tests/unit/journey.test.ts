import { describe, expect, it } from "vitest";
import { localDate, originsFor } from "@/components/useJourney";

describe("useJourney helpers", () => {
  it("originsFor keeps only the active locale's explanations", () => {
    const explanations = {
      "A-RAFT:es": { text: "x", origin: "generated" as const },
      "A-RAFT:en": { text: "y", origin: "rule_based" as const },
      "A-SNAP:es": { text: "z", origin: "rule_based" as const },
    };
    expect(originsFor(explanations, "es")).toEqual({ "A-RAFT": "generated", "A-SNAP": "rule_based" });
    expect(originsFor(explanations, "en")).toEqual({ "A-RAFT": "rule_based" });
    expect(originsFor({}, "en")).toEqual({});
  });

  it("localDate formats the local calendar date as YYYY-MM-DD", () => {
    expect(localDate(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(localDate(new Date(2026, 9, 24))).toBe("2026-10-24");
  });
});
