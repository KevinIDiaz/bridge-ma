import type { ActionEdge, ActionId, GraphError } from "./types";

/**
 * Collects every structural error: duplicate IDs, dangling edges, and cycles.
 * A valid graph (including one with zero edges) returns [].
 */
export function validateGraph(g: { nodes: readonly { id: ActionId }[]; edges: readonly ActionEdge[] }): GraphError[] {
  const errors: GraphError[] = [];

  // 1. Duplicates, in first-seen order.
  const counts = new Map<ActionId, number>();
  for (const n of g.nodes) counts.set(n.id, (counts.get(n.id) ?? 0) + 1);
  for (const [id, c] of counts) if (c >= 2) errors.push({ kind: "duplicate_id", id });

  // 2. Dangling edges.
  const ids = new Set(counts.keys());
  const live: ActionEdge[] = [];
  for (const e of g.edges) {
    const f = ids.has(e.from);
    const t = ids.has(e.to);
    if (f && t) live.push(e);
    else errors.push({ kind: "dangling_edge", from: e.from, to: e.to, absent: !f && !t ? "both" : !f ? "from" : "to" });
  }

  // 3. Cycles: self-loops, then iterative DFS for back edges.
  const adj = new Map<ActionId, ActionId[]>();
  for (const id of ids) adj.set(id, []);
  for (const e of live) {
    if (e.from === e.to) errors.push({ kind: "cycle", ids: [e.from] });
    else adj.get(e.from)!.push(e.to);
  }

  const color = new Map<ActionId, 0 | 1 | 2>(); // 0 white, 1 gray, 2 black
  for (const start of ids) {
    if ((color.get(start) ?? 0) !== 0) continue;
    const path: ActionId[] = [start];
    const next: number[] = [0];
    color.set(start, 1);
    while (path.length > 0) {
      const u = path[path.length - 1];
      const out = adj.get(u)!;
      const i = next[next.length - 1];
      if (i < out.length) {
        next[next.length - 1] = i + 1;
        const v = out[i];
        const c = color.get(v) ?? 0;
        if (c === 1) errors.push({ kind: "cycle", ids: path.slice(path.indexOf(v)) });
        else if (c === 0) {
          color.set(v, 1);
          path.push(v);
          next.push(0);
        }
      } else {
        color.set(u, 2);
        path.pop();
        next.pop();
      }
    }
  }

  return errors;
}
