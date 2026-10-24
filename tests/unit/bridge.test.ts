import { describe, expect, it } from "vitest";
import { fixtureResult } from "@/lib/data/programs";
import { evaluateBridge } from "@/lib/rules/bridge";
import type { Fixture, FixtureError, Result } from "@/lib/rules/types";
import { deepFreeze, demoFacts, v2 } from "./demo-facts";

const ok = (f: Fixture): Result<Fixture, FixtureError> => ({ ok: true, value: f });

describe("evaluateBridge", () => {
  it("demo persona with all facts confirmed", () => {
    const r = evaluateBridge({ facts: demoFacts("confirmed"), fixture: fixtureResult, today: "2026-10-24" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.fixtureVersion).toBe(2);
    expect(r.value.evaluations.map((e) => e.programId)).toEqual(["snap", "raft", "utility"]);
    expect(r.value.graph.nodes.map((n) => n.id)).toEqual(["A-RAFT", "A-SNAP", "A-UTIL"]);
    const eid = r.value.evidence.find((e) => e.evidenceTypeId === "E-ID")!;
    expect(eid.uses.map((u) => u.actionId)).toEqual(["A-RAFT", "A-SNAP", "A-UTIL"]);
    expect(r.value.evidence.map((e) => e.evidenceTypeId)).toEqual(["E-ID", "E-NTQ", "E-LEASE", "E-JOB-LOSS", "E-HOUSEHOLD", "E-UTIL-BILL"]);
    expect(r.value.handoff.generatedAt).toBe("2026-10-24");
  });

  it("fixture_error when the fixture did not parse", () => {
    const fixture = { ok: false as const, errors: [{ code: "unknown_source", ids: ["R-SNAP", "S-X"] }] };
    expect(evaluateBridge({ facts: [], fixture, today: "2026-10-24" })).toEqual({
      ok: false,
      errors: [{ kind: "fixture_error", errors: fixture.errors }],
    });
  });

  it("engine_error when a program has no rule", () => {
    const f = v2();
    f.rules = f.rules.filter((r) => r.programId !== "snap");
    const r = evaluateBridge({ facts: demoFacts("confirmed"), fixture: ok(f), today: "2026-10-24" });
    expect(r).toEqual({ ok: false, errors: [{ kind: "engine_error", errors: [{ kind: "rule_count", programId: "snap" }] }] });
  });

  it("build_error when a cited source is missing", () => {
    const f = v2();
    f.sources = f.sources.filter((s) => s.id !== "S-RAFT-01");
    const r = evaluateBridge({ facts: demoFacts("confirmed"), fixture: ok(f), today: "2026-10-24" });
    expect(r).toEqual({
      ok: false,
      errors: [{ kind: "build_error", errors: [{ kind: "missing_ref", ref: "source", id: "S-RAFT-01" }] }],
    });
  });

  it("graph_error when two actions share an ID", () => {
    const f = v2();
    f.actions[2].id = "A-SNAP";
    const r = evaluateBridge({ facts: demoFacts("confirmed"), fixture: ok(f), today: "2026-10-24" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0].kind).toBe("graph_error");
    expect(r.errors[0].errors).toContainEqual({ kind: "duplicate_id", id: "A-SNAP" });
  });

  it("does not mutate frozen inputs, and the output can be frozen", () => {
    const facts = deepFreeze(demoFacts("confirmed"));
    const fixture = deepFreeze(ok(v2()));
    const first = evaluateBridge({ facts, fixture, today: "2026-10-24" });
    const second = evaluateBridge({ facts, fixture, today: "2026-10-24" });
    expect(() => deepFreeze(first)).not.toThrow();
    expect(second).toEqual(first);
  });
});
