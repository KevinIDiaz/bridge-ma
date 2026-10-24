#!/usr/bin/env node
// Rule/source referential check. Usage: node scripts/validate-provenance.mjs [fixture.json]
// Default: the highest-numbered src/fixtures/programs.v<N>.json.
//
// Works on the v1 shape (sources + programs) and the v2 shape (adds facts, rules, actions,
// evidence, edges). It checks references only; the Lead's parseFixture remains the full loader.
// Exit code 0 = valid, 1 = problems found (each printed on its own line).
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

function defaultFixture() {
  const dir = resolve("src/fixtures");
  const files = readdirSync(dir)
    .map((f) => ({ f, m: f.match(/^programs\.v(\d+)\.json$/) }))
    .filter((x) => x.m)
    .sort((a, b) => Number(b.m[1]) - Number(a.m[1]));
  if (files.length === 0) throw new Error(`no programs.v<N>.json in ${dir}`);
  return join(dir, files[0].f);
}

const file = resolve(process.argv[2] ?? defaultFixture());
const fx = JSON.parse(readFileSync(file, "utf8"));
const problems = [];
const arr = (v) => (Array.isArray(v) ? v : []);

const PROGRAMS = new Set(["snap", "raft", "utility"]);
const STATUSES = new Set(["reviewed", "unreviewed", "stale"]);

if (fx.fictionalDemo !== true) problems.push("fixture: fictionalDemo must be true");

// Sources
const sources = new Map();
for (const s of arr(fx.sources)) {
  if (sources.has(s.id)) problems.push(`source ${s.id}: duplicate id`);
  sources.set(s.id, s);
  if (!PROGRAMS.has(s.programId)) problems.push(`source ${s.id}: unknown programId ${s.programId}`);
  if (!STATUSES.has(s.reviewStatus)) problems.push(`source ${s.id}: unknown reviewStatus ${s.reviewStatus}`);
  if (s.reviewStatus === "reviewed" && (!s.url || !s.retrieved)) problems.push(`source ${s.id}: reviewed source needs url and retrieved date`);
  if (s.reviewStatus !== "reviewed" && s.url) problems.push(`source ${s.id}: has a URL but is ${s.reviewStatus}; only reviewed sources may be linked`);
}

// Programs
for (const p of arr(fx.programs)) {
  for (const id of arr(p.sourceIds)) if (!sources.has(id)) problems.push(`program ${p.id}: unknown source ${id}`);
}

// Rules (v2+)
const rules = new Map();
for (const r of arr(fx.rules)) {
  if (rules.has(r.id)) problems.push(`rule ${r.id}: duplicate id`);
  rules.set(r.id, r);
  if (arr(r.sourceIds).length === 0) problems.push(`rule ${r.id}: cites no source`);
  for (const id of arr(r.sourceIds)) {
    const s = sources.get(id);
    if (!s) problems.push(`rule ${r.id}: unknown source ${id}`);
    else if (s.programId !== r.programId) problems.push(`rule ${r.id}: source ${id} belongs to ${s.programId}, not ${r.programId}`);
  }
  const notReviewed = arr(r.sourceIds).filter((id) => sources.get(id)?.reviewStatus !== "reviewed");
  if (r.synthetic === false && notReviewed.length > 0) {
    problems.push(`rule ${r.id}: synthetic:false but cites non-reviewed source(s) ${notReviewed.join(", ")}`);
  }
  if (notReviewed.length > 0 && r.deadline != null) problems.push(`rule ${r.id}: deadline set while citing non-reviewed source(s)`);
  if (typeof r.version !== "number") problems.push(`rule ${r.id}: version must be a number`);
}

// Actions, evidence, edges (v2+)
const actions = new Map();
for (const a of arr(fx.actions)) {
  if (actions.has(a.id)) problems.push(`action ${a.id}: duplicate id`);
  actions.set(a.id, a);
  const r = rules.get(a.ruleId);
  if (!r) problems.push(`action ${a.id}: unknown rule ${a.ruleId}`);
  else if (r.programId !== a.programId) problems.push(`action ${a.id}: rule ${a.ruleId} is for ${r.programId}, not ${a.programId}`);
}
const evidenceTypes = new Set(arr(fx.evidenceTypes).map((e) => e.id));
const pairs = new Set();
for (const er of arr(fx.evidenceRequirements)) {
  if (!evidenceTypes.has(er.evidenceTypeId)) problems.push(`evidence requirement: unknown evidence type ${er.evidenceTypeId}`);
  if (!actions.has(er.actionId)) problems.push(`evidence requirement: unknown action ${er.actionId}`);
  const pair = `${er.evidenceTypeId}|${er.actionId}`;
  if (pairs.has(pair)) problems.push(`evidence requirement: repeated pair ${er.evidenceTypeId} / ${er.actionId}`);
  pairs.add(pair);
}
for (const e of arr(fx.edges)) {
  if (!actions.has(e.from)) problems.push(`edge ${e.from} -> ${e.to}: unknown from action`);
  if (!actions.has(e.to)) problems.push(`edge ${e.from} -> ${e.to}: unknown to action`);
  if (e.from === e.to) problems.push(`edge ${e.from} -> ${e.to}: self-loop`);
}

const label = `${file} (version ${fx.version})`;
if (problems.length > 0) {
  console.error(`Provenance validation failed for ${label} (${problems.length} problem${problems.length === 1 ? "" : "s"}):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `Provenance validation passed for ${label}: ${sources.size} sources, ${rules.size} rules, ${actions.size} actions, ${arr(fx.edges).length} edges.`,
);
