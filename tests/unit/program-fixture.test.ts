import { describe, expect, it } from "vitest";
import raw from "@/fixtures/programs.v1.json";
import { parseProgramFixture, programFixture, programIds } from "@/lib/data/programs";

const clone = () => structuredClone(raw) as unknown as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

describe("programs.v1.json fixture", () => {
  it("parses and covers exactly SNAP, RAFT, and utility protection", () => {
    expect(programFixture.version).toBe(1);
    expect(programFixture.programs.map((p) => p.id).sort()).toEqual([...programIds].sort());
  });

  it("has no reviewed sources yet (none have been checked against official pages)", () => {
    expect(programFixture.sources.every((s) => s.reviewStatus === "unreviewed")).toBe(true);
  });

  it("rejects a program that cites a source that does not exist", () => {
    const bad = clone();
    bad.programs[0].sourceIds = ["S-NOPE"];
    expect(() => parseProgramFixture(bad)).toThrow(/unknown source/);
  });

  it("rejects a reviewed source without a URL", () => {
    const bad = clone();
    bad.sources[0].reviewStatus = "reviewed";
    expect(() => parseProgramFixture(bad)).toThrow(/reviewed sources need url/);
  });

  it("rejects an unknown review status", () => {
    const bad = clone();
    bad.sources[0].reviewStatus = "verified";
    expect(() => parseProgramFixture(bad)).toThrow(/unknown reviewStatus/);
  });

  it("rejects a fixture not marked as fictional demo data", () => {
    const bad = clone();
    bad.fictionalDemo = false;
    expect(() => parseProgramFixture(bad)).toThrow(/fictionalDemo/);
  });
});
