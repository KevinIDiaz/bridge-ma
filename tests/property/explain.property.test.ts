import fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExplainInput, GeneratedText, ModelAdapter } from "@/lib/model/adapter";
import { EXPLANATION_MAX_CHARS, explainWithFallback } from "@/lib/model/explain";
import { evaluatePrograms } from "@/lib/rules/engine";
import { splitFacts } from "@/lib/rules/facts";
import { buildGraph } from "@/lib/rules/graph";
import type { ActionId, ExplanationOrigin, MatchStatus, ResidentFact } from "@/lib/rules/types";
import { arbFactSet, NUM_RUNS, v2Fixture } from "./arbitraries";

const fixture = v2Fixture();
const TEMPLATE = "Fictional rule-based template.";

type Behavior = { kind: "text"; text: string } | { kind: "throw" } | { kind: "hang" };
const arbBehavior: fc.Arbitrary<Behavior> = fc.oneof(
  fc.string({ maxLength: 2000 }).map((text) => ({ kind: "text" as const, text })),
  fc.constant({ kind: "throw" as const }),
  fc.constant({ kind: "hang" as const }),
);

function fakeAdapter(b: Behavior, deterministic: boolean, calls: unknown[]): ModelAdapter {
  return {
    id: "fake",
    deterministic,
    normalize: async (t) => ({ kind: "generated", provider: "fake", text: t }),
    explain: (input: ExplainInput): Promise<GeneratedText> => {
      calls.push(input);
      if (b.kind === "throw") return Promise.reject(new Error("fictional failure"));
      if (b.kind === "hang") return new Promise<GeneratedText>(() => {});
      return Promise.resolve({ kind: "generated", provider: "fake", text: b.text });
    },
  };
}

/** Runs explainWithFallback under fake timers, advancing past the 5 s timeout. */
async function explain(adapter: ModelAdapter, input: ExplainInput) {
  const p = explainWithFallback(adapter, input, 5000, TEMPLATE);
  await vi.advanceTimersByTimeAsync(5001);
  return p;
}

function pipeline(facts: ResidentFact[], origins?: Record<ActionId, ExplanationOrigin>) {
  const ef = splitFacts(facts, fixture.facts);
  const ev = evaluatePrograms(ef, fixture);
  if (!ev.ok) throw new Error("engine failed");
  const g = buildGraph({ evaluations: ev.value, facts: ef, fixture, explanationOrigins: origins });
  if (!g.ok) throw new Error("build failed");
  return { evaluations: ev.value, graph: g.value };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("explanations (property)", () => {
  // Feature: action-graph, Property 14: Model output never changes matching
  it("Property 14: adapter output, failure, or timeout never changes evaluations or the graph", async () => {
    await fc.assert(
      fc.asyncProperty(arbFactSet(), arbBehavior, fc.boolean(), fc.constantFrom("en" as const, "es" as const), async (facts, b, det, locale) => {
        const base = pipeline(facts);
        const calls: unknown[] = [];
        const adapter = fakeAdapter(b, det, calls);
        const origins: Record<ActionId, ExplanationOrigin> = {};
        for (const n of base.graph.nodes) {
          const e = await explain(adapter, { programId: n.programId, status: n.status, locale });
          origins[n.id] = e.origin;
          const failed = b.kind !== "text" || b.text.trim() === "";
          if (failed) expect(e).toEqual({ text: TEMPLATE, origin: "rule_based" });
          else expect(e.origin).toBe(det ? "rule_based" : "generated");
        }
        for (const c of calls) expect(Object.keys(c as object).sort()).toEqual(["locale", "programId", "status"]);

        const withModel = pipeline(facts, origins);
        expect(withModel.evaluations).toEqual(base.evaluations);
        expect(withModel.graph.edges).toEqual(base.graph.edges);
        const strip = (g: typeof base.graph) => g.nodes.map((n) => ({ ...n, explanationOrigin: null }));
        expect(strip(withModel.graph)).toEqual(strip(base.graph));
      }),
      NUM_RUNS,
    );
  });

  // Feature: action-graph, Property 15: Explanation text is capped
  it("Property 15: text is at most 600 characters and a prefix of the adapter output or the template", async () => {
    const arbStatus = fc.constantFrom<MatchStatus>("may_match", "likely_not", "cant_tell");
    await fc.assert(
      fc.asyncProperty(fc.string({ maxLength: 2000 }), arbStatus, async (text, status) => {
        const e = await explain(fakeAdapter({ kind: "text", text }, false, []), { programId: "snap", status, locale: "en" });
        expect(e.text.length).toBeLessThanOrEqual(EXPLANATION_MAX_CHARS);
        expect(text.startsWith(e.text) || TEMPLATE.startsWith(e.text)).toBe(true);
      }),
      NUM_RUNS,
    );
  });
});
