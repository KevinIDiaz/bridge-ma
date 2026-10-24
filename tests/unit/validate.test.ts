import { describe, expect, it } from "vitest";
import { validateGraph } from "@/lib/rules/validate";

const e = (from: string, to: string) => ({ from, to, reasonKey: "edge.test" });

describe("validateGraph", () => {
  it("reports duplicates, dangling edges, and cycles together", () => {
    const errors = validateGraph({
      nodes: [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "A" }],
      edges: [e("A", "B"), e("B", "C"), e("C", "A"), e("A", "X"), e("Y", "B"), e("X", "Y"), e("C", "C")],
    });
    expect(errors).toContainEqual({ kind: "duplicate_id", id: "A" });
    expect(errors).toContainEqual({ kind: "dangling_edge", from: "A", to: "X", absent: "to" });
    expect(errors).toContainEqual({ kind: "dangling_edge", from: "Y", to: "B", absent: "from" });
    expect(errors).toContainEqual({ kind: "dangling_edge", from: "X", to: "Y", absent: "both" });
    expect(errors).toContainEqual({ kind: "cycle", ids: ["C"] });
    expect(errors).toContainEqual({ kind: "cycle", ids: ["A", "B", "C"] });
  });

  it("returns [] for a valid graph with zero edges", () => {
    expect(validateGraph({ nodes: [{ id: "A" }, { id: "B" }], edges: [] })).toEqual([]);
  });

  it("returns [] for a valid DAG", () => {
    expect(validateGraph({ nodes: [{ id: "A" }, { id: "B" }, { id: "C" }], edges: [e("A", "B"), e("A", "C"), e("B", "C")] })).toEqual([]);
  });
});
