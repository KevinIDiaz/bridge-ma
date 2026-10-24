import { describe, expect, it } from "vitest";
import { evaluatePrograms } from "@/lib/rules/engine";
import { splitFacts } from "@/lib/rules/facts";
import { buildGraph } from "@/lib/rules/graph";
import type { Fixture, ResidentFact } from "@/lib/rules/types";
import { validateGraph } from "@/lib/rules/validate";
import { demoFacts, v2 } from "./demo-facts";

function run(facts: ResidentFact[], fixture: Fixture = v2()) {
  const ef = splitFacts(facts, fixture.facts);
  const ev = evaluatePrograms(ef, fixture);
  if (!ev.ok) throw new Error("engine failed");
  return { result: buildGraph({ evaluations: ev.value, facts: ef, fixture }), evaluations: ev.value, ef, fixture };
}

describe("buildGraph", () => {
  it("matches the demo outcome table after full confirmation", () => {
    const { result } = run(demoFacts("confirmed"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const g = result.value;
    expect(g.nodes.map((n) => [n.id, n.status, n.urgency, n.sourceFreshness, n.factConfirmation])).toEqual([
      ["A-RAFT", "may_match", "urgent", "unreviewed", "all_confirmed"],
      ["A-SNAP", "may_match", "standard", "unreviewed", "all_confirmed"],
      ["A-UTIL", "cant_tell", "unknown", "unreviewed", "has_missing"],
    ]);
    for (const n of g.nodes) {
      expect(n.deadline).toEqual({ kind: "unknown", reason: "source_unreviewed" });
      expect(n.explanationOrigin).toBe("rule_based");
    }
    expect(g.nodes.map((n) => n.handoff)).toEqual([
      { kind: "human", option: "legal_aid" },
      { kind: "human", option: "program_office" },
      { kind: "human", option: "general_help_line" },
    ]);
    expect(g.edges.map((e) => [e.from, e.to])).toEqual([
      ["A-RAFT", "A-SNAP"],
      ["A-RAFT", "A-UTIL"],
    ]);
    expect(validateGraph(g)).toEqual([]);
  });

  it("links reusable evidence across actions in graph order", () => {
    const { result } = run(demoFacts("confirmed"));
    if (!result.ok) throw new Error("build failed");
    const raft = result.value.nodes[0];
    expect(raft.evidence.find((e) => e.evidenceTypeId === "E-ID")?.reusedBy).toEqual(["A-SNAP", "A-UTIL"]);
    expect(raft.evidence.find((e) => e.evidenceTypeId === "E-LEASE")?.reusedBy).toEqual([]);
    const snap = result.value.nodes[1];
    expect(snap.evidence.find((e) => e.evidenceTypeId === "E-JOB-LOSS")).toEqual({
      evidenceTypeId: "E-JOB-LOSS",
      level: "required",
      reusedBy: ["A-RAFT", "A-UTIL"],
    });
  });

  // Design prose says "no edges are kept" here, but the forward-only rule (D-037, Req 5.5)
  // keeps RAFT -> UTIL because RAFT is still before UTIL. The rule wins (D-101).
  it("before confirmation orders SNAP, RAFT, UTIL and drops the backward RAFT -> SNAP edge", () => {
    const { result } = run(demoFacts("unconfirmed"));
    if (!result.ok) throw new Error("build failed");
    expect(result.value.nodes.map((n) => [n.id, n.urgency, n.factConfirmation])).toEqual([
      ["A-SNAP", "standard", "has_unconfirmed"],
      ["A-RAFT", "unknown", "has_unconfirmed"],
      ["A-UTIL", "unknown", "has_unconfirmed"],
    ]);
    expect(result.value.edges.map((e) => [e.from, e.to])).toEqual([["A-RAFT", "A-UTIL"]]);
  });

  it("uses explanationOrigins only for explanationOrigin", () => {
    const { evaluations, ef, fixture, result } = run(demoFacts("confirmed"));
    const withOrigin = buildGraph({ evaluations, facts: ef, fixture, explanationOrigins: { "A-SNAP": "generated" } });
    if (!result.ok || !withOrigin.ok) throw new Error("build failed");
    const snap = withOrigin.value.nodes.find((n) => n.id === "A-SNAP")!;
    expect(snap.explanationOrigin).toBe("generated");
    expect({ ...snap, explanationOrigin: "rule_based" }).toEqual(result.value.nodes.find((n) => n.id === "A-SNAP"));
  });

  it("returns missing_ref for a missing evaluation, rule, or source", () => {
    const { evaluations, ef, fixture } = run(demoFacts("confirmed"));
    expect(buildGraph({ evaluations: evaluations.slice(1), facts: ef, fixture })).toEqual({
      ok: false,
      errors: [{ kind: "missing_ref", ref: "evaluation", id: "snap" }],
    });

    const noRule = structuredClone(fixture);
    noRule.actions[0].ruleId = "R-NOPE";
    expect(buildGraph({ evaluations, facts: ef, fixture: noRule })).toEqual({
      ok: false,
      errors: [{ kind: "missing_ref", ref: "rule", id: "R-NOPE" }],
    });

    const noSource = structuredClone(fixture);
    noSource.sources = noSource.sources.filter((s) => s.id !== "S-UTIL-01");
    expect(buildGraph({ evaluations, facts: ef, fixture: noSource })).toEqual({
      ok: false,
      errors: [{ kind: "missing_ref", ref: "source", id: "S-UTIL-01" }],
    });
  });

  it("selects a portal only for a reviewed source with a URL", () => {
    const fixture = v2();
    const s = fixture.sources.find((x) => x.id === "S-SNAP-01")!;
    Object.assign(s, { reviewStatus: "reviewed", url: "https://example.org/fictional/snap", retrieved: "2026-01-01" });
    const { result } = run(demoFacts("confirmed"), fixture);
    if (!result.ok) throw new Error("build failed");
    const snap = result.value.nodes.find((n) => n.id === "A-SNAP")!;
    expect(snap.handoff).toEqual({ kind: "portal", sourceId: "S-SNAP-01", url: "https://example.org/fictional/snap", publisher: s.publisher });
    expect(snap.sourceFreshness).toBe("reviewed");
    expect(snap.deadline).toEqual({ kind: "unknown", reason: "unsupported" });
  });
});
