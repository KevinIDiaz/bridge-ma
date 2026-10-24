import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { ActionEdge } from "@/lib/rules/types";
import { validateGraph } from "@/lib/rules/validate";
import { arbGraphForCycles, arbGraphWithDangling, arbGraphWithDuplicates, NUM_RUNS } from "./arbitraries";

/** Kahn's algorithm: true when not every node can be removed. */
function hasCycleKahn(ids: string[], edges: readonly ActionEdge[]): boolean {
  const indeg = new Map(ids.map((id) => [id, 0]));
  for (const e of edges) indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  const queue = ids.filter((id) => indeg.get(id) === 0);
  let removed = 0;
  while (queue.length > 0) {
    const u = queue.shift()!;
    removed++;
    for (const e of edges) {
      if (e.from !== u) continue;
      indeg.set(e.to, indeg.get(e.to)! - 1);
      if (indeg.get(e.to) === 0) queue.push(e.to);
    }
  }
  return removed < ids.length;
}

describe("graph validator (property)", () => {
  // Feature: action-graph, Property 11: Validator reports every duplicate ID
  it("Property 11: one duplicate_id error per ID occurring two or more times", () => {
    fc.assert(
      fc.property(arbGraphWithDuplicates, (g) => {
        const counts = new Map<string, number>();
        for (const n of g.nodes) counts.set(n.id, (counts.get(n.id) ?? 0) + 1);
        const expected = [...counts].filter(([, c]) => c >= 2).map(([id]) => id);
        const got = validateGraph(g).flatMap((e) => (e.kind === "duplicate_id" ? [e.id] : []));
        expect(got).toEqual(expected);
      }),
      NUM_RUNS,
    );
  });

  // Feature: action-graph, Property 12: Validator reports every dangling edge
  it("Property 12: dangling_edge errors match edges with an absent endpoint one-to-one", () => {
    fc.assert(
      fc.property(arbGraphWithDangling, (g) => {
        const expected = g.edges
          .filter((e) => g.absent.has(e.from) || g.absent.has(e.to))
          .map((e) => ({
            kind: "dangling_edge",
            from: e.from,
            to: e.to,
            absent: g.absent.has(e.from) && g.absent.has(e.to) ? "both" : g.absent.has(e.from) ? "from" : "to",
          }));
        expect(validateGraph(g).filter((e) => e.kind === "dangling_edge")).toEqual(expected);
      }),
      NUM_RUNS,
    );
  });

  // Feature: action-graph, Property 13: Cycle detection matches a reference
  it("Property 13: a cycle error appears iff Kahn's algorithm finds a cycle, and each reported cycle is real", () => {
    fc.assert(
      fc.property(arbGraphForCycles, (g) => {
        const cycles = validateGraph(g).flatMap((e) => (e.kind === "cycle" ? [e.ids] : []));
        expect(cycles.length > 0).toBe(hasCycleKahn(g.nodes.map((n) => n.id), g.edges));
        const has = (a: string, b: string) => g.edges.some((e) => e.from === a && e.to === b);
        for (const ids of cycles) {
          expect(ids.length).toBeGreaterThan(0);
          ids.forEach((id, i) => expect(has(id, ids[(i + 1) % ids.length])).toBe(true));
        }
      }),
      NUM_RUNS,
    );
  });
});
