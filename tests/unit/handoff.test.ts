import { describe, expect, it } from "vitest";
import { evaluatePrograms } from "@/lib/rules/engine";
import { splitFacts } from "@/lib/rules/facts";
import { buildGraph } from "@/lib/rules/graph";
import { buildHandoffPacket } from "@/lib/rules/handoff";
import { demoFacts, v2 } from "./demo-facts";

describe("buildHandoffPacket", () => {
  it("demo persona after confirmation", () => {
    const fixture = v2();
    const facts = demoFacts("confirmed");
    const ef = splitFacts(facts, fixture.facts);
    const ev = evaluatePrograms(ef, fixture);
    if (!ev.ok) throw new Error("engine failed");
    const g = buildGraph({ evaluations: ev.value, facts: ef, fixture });
    if (!g.ok) throw new Error("build failed");

    const p = buildHandoffPacket({ graph: g.value, facts, evaluations: ev.value, fixture, today: "2026-10-24" });

    expect(p.generatedAt).toBe("2026-10-24");
    expect(p.fixtureVersion).toBe(2);
    expect(p.unknownFacts).toEqual([{ factId: "received_shutoff_notice", state: "unknown" }]);
    expect(p.confirmedFacts.some((f) => f.id === "neighborhood")).toBe(false);
    expect(p.confirmedFacts.find((f) => f.id === "received_shutoff_notice")?.value).toBe("unknown");
    expect(p.actions.map((a) => a.id)).toEqual(["A-RAFT", "A-SNAP", "A-UTIL"]);
    expect(p.ruleVersions).toEqual([
      { ruleId: "R-RAFT", version: 1 },
      { ruleId: "R-SNAP", version: 1 },
      { ruleId: "R-UTIL", version: 1 },
    ]);
    expect(p.handoffTargets.map((t) => t.target.kind)).toEqual(["human", "human", "human"]);
    expect(p.evidence[0]).toEqual({
      evidenceTypeId: "E-ID",
      uses: [
        { actionId: "A-RAFT", level: "required" },
        { actionId: "A-SNAP", level: "required" },
        { actionId: "A-UTIL", level: "required" },
      ],
      synthetic: true,
    });
  });

  it("lists absent required facts as missing and unconfirmed ones as unconfirmed", () => {
    const fixture = v2();
    const facts = demoFacts("confirmed")
      .filter((f) => f.id !== "has_utility_account")
      .map((f) => (f.id === "rents_home" ? { ...f, confirmation: "unconfirmed" as const } : f));
    const ef = splitFacts(facts, fixture.facts);
    const ev = evaluatePrograms(ef, fixture);
    if (!ev.ok) throw new Error("engine failed");
    const g = buildGraph({ evaluations: ev.value, facts: ef, fixture });
    if (!g.ok) throw new Error("build failed");
    const p = buildHandoffPacket({ graph: g.value, facts, evaluations: ev.value, fixture, today: "2026-10-24" });
    expect(p.unknownFacts).toEqual([
      { factId: "rents_home", state: "unconfirmed" },
      { factId: "has_utility_account", state: "missing" },
      { factId: "received_shutoff_notice", state: "unknown" },
    ]);
  });
});
