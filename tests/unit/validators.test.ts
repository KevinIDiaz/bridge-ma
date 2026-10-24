// Runs the CLI validators in scripts/ against the real files and against deliberately broken copies
// written to a temp folder (removed after each test).
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { STUB_FIXTURE } from "@/components/steps/stubJourney";

const run = (script: string, ...args: string[]) => {
  const r = spawnSync(process.execPath, [join("scripts", script), ...args], { encoding: "utf8" });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
};

let tmp: string | null = null;
const tempDir = () => (tmp = mkdtempSync(join(tmpdir(), "bridge-validate-")));
afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = null;
});

const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8")) as Record<string, Record<string, unknown>>;

describe("validate-locales", () => {
  it("passes on the real dictionaries", () => {
    const r = run("validate-locales.mjs");
    expect(r.out).toContain("Locale validation passed");
    expect(r.code).toBe(0);
  });

  it("fails and names a key missing from one language", () => {
    const dir = tempDir();
    const en = readJson("src/lib/i18n/en.json");
    const es = readJson("src/lib/i18n/es.json");
    delete es.labels.unverified;
    writeFileSync(join(dir, "en.json"), JSON.stringify(en));
    writeFileSync(join(dir, "es.json"), JSON.stringify(es));
    const r = run("validate-locales.mjs", dir);
    expect(r.code).toBe(1);
    expect(r.out).toContain("es: missing key labels.unverified");
  });

  it("fails when placeholders differ or a value is empty", () => {
    const dir = tempDir();
    const en = readJson("src/lib/i18n/en.json");
    const es = readJson("src/lib/i18n/es.json");
    es.actions.ruleLine = "Regla {ruleId}, versión {version}";
    es.status.may_match = " ";
    writeFileSync(join(dir, "en.json"), JSON.stringify(en));
    writeFileSync(join(dir, "es.json"), JSON.stringify(es));
    const r = run("validate-locales.mjs", dir);
    expect(r.code).toBe(1);
    expect(r.out).toContain("actions.ruleLine: placeholders differ");
    expect(r.out).toContain("es: status.may_match is empty");
  });
});

describe("validate-provenance", () => {
  it("passes on the current fixture", () => {
    const r = run("validate-provenance.mjs");
    expect(r.out).toContain("Provenance validation passed");
    expect(r.code).toBe(0);
  });

  it("passes on the v2-shaped stub fixture", () => {
    const file = join(tempDir(), "programs.v2.json");
    writeFileSync(file, JSON.stringify(STUB_FIXTURE));
    const r = run("validate-provenance.mjs", file);
    expect(r.out).toContain("3 sources, 3 rules, 3 actions, 2 edges");
    expect(r.code).toBe(0);
  });

  it("fails on a missing source reference, synthetic:false with an unreviewed source, and dangling references", () => {
    const fx = structuredClone(STUB_FIXTURE);
    fx.rules[0].sourceIds = ["S-MISSING"];
    fx.rules[1].synthetic = false;
    fx.actions[2].ruleId = "R-NOPE";
    fx.evidenceRequirements.push({ actionId: "A-SNAP", evidenceTypeId: "E-NOPE", level: "helpful" });
    fx.edges.push({ from: "A-RAFT", to: "A-GONE", reasonKey: "edge.housing_first" });
    const file = join(tempDir(), "programs.v2.json");
    writeFileSync(file, JSON.stringify(fx));
    const r = run("validate-provenance.mjs", file);
    expect(r.code).toBe(1);
    expect(r.out).toContain("rule R-SNAP: unknown source S-MISSING");
    expect(r.out).toContain("rule R-RAFT: synthetic:false but cites non-reviewed source(s) S-RAFT-01");
    expect(r.out).toContain("action A-UTIL: unknown rule R-NOPE");
    expect(r.out).toContain("unknown evidence type E-NOPE");
    expect(r.out).toContain("edge A-RAFT -> A-GONE: unknown to action");
  });

  it("fails when an unreviewed source carries a URL", () => {
    const fx = structuredClone(STUB_FIXTURE);
    fx.sources[0].url = "https://example.org/unreviewed";
    const file = join(tempDir(), "programs.v2.json");
    writeFileSync(file, JSON.stringify(fx));
    const r = run("validate-provenance.mjs", file);
    expect(r.code).toBe(1);
    expect(r.out).toContain("source S-SNAP-01: has a URL but is unreviewed");
  });
});
