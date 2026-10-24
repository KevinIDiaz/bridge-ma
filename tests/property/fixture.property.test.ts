import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { parseFixture } from "@/lib/data/programs";
import { arbFixture, NUM_RUNS } from "./arbitraries";

describe("fixture loader (property)", () => {
  // Feature: action-graph, Property 18: Fixture round trip
  it("Property 18: any valid generated fixture parses, and its JSON round trip parses to an equal value", () => {
    fc.assert(
      fc.property(arbFixture, (f) => {
        const first = parseFixture(f);
        expect(first.ok ? [] : first.errors).toEqual([]);
        if (!first.ok) return;
        const second = parseFixture(JSON.parse(JSON.stringify(first.value)));
        expect(second.ok).toBe(true);
        expect(second.ok && second.value).toEqual(first.value);
      }),
      NUM_RUNS,
    );
  });
});
