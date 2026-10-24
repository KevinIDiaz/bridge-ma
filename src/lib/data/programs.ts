// Fixture loader for src/fixtures/programs.v2.json.
// Pure and React-free. Collects every problem and returns no partial data.
import raw from "@/fixtures/programs.v2.json";
import type { Fixture, FixtureError, ProgramId, Result, ReviewStatus } from "@/lib/rules/types";

export type { ProgramId, ReviewStatus } from "@/lib/rules/types";

export const programIds = ["snap", "raft", "utility"] as const satisfies readonly ProgramId[];
export const reviewStatuses = ["unreviewed", "reviewed", "stale"] as const satisfies readonly ReviewStatus[];
const factKinds = ["boolean", "number", "choice", "text", "date"] as const;
const humanHelpOptions = ["legal_aid", "program_office", "general_help_line"] as const;
const evidenceLevels = ["required", "helpful"] as const;

/** Req 4.7: no amounts, day counts, or dates on records backed by an unreviewed/stale source. */
export const NO_NUMBERS_PATTERN = /\$\s?\d|\d+\s*(day|días?|month|mes)|\d{4}-\d{2}-\d{2}/i;

type Rec = Record<string, unknown>;
const isRecord = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v !== "";
const isStringOrNull = (v: unknown): v is string | null => v === null || typeof v === "string";
const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T => (list as readonly unknown[]).includes(v);

/** True for a real calendar date in YYYY-MM-DD form. */
export function isIsoDate(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** Every string value nested anywhere in `v`. */
function collectStrings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => collectStrings(x, out));
  else if (isRecord(v)) Object.values(v).forEach((x) => collectStrings(x, out));
  return out;
}

const idOf = (v: unknown, fallback: string): string => (isRecord(v) && isNonEmptyString(v.id) ? v.id : fallback);

export function parseFixture(input: unknown): Result<Fixture, FixtureError> {
  const errors: FixtureError[] = [];
  const err = (code: string, ...ids: string[]) => errors.push({ code, ids });

  if (!isRecord(input)) return { ok: false, errors: [{ code: "not_object", ids: [] }] };
  if (!isInt(input.version) || input.version < 1) err("bad_version");
  if (input.fictionalDemo !== true) err("not_fictional_demo");
  const arrays = ["sources", "programs", "facts", "rules", "actions", "evidenceTypes", "evidenceRequirements", "edges"] as const;
  const missingArrays = arrays.filter((k) => !Array.isArray(input[k]));
  if (missingArrays.length > 0) {
    err("missing_arrays", ...missingArrays);
    return { ok: false, errors };
  }
  const arr = (k: (typeof arrays)[number]) => input[k] as unknown[];

  // Sources
  const sources = new Map<string, Rec>();
  arr("sources").forEach((s, i) => {
    const id = idOf(s, `sources[${i}]`);
    if (!isRecord(s) || !isNonEmptyString(s.id)) return err("bad_source", id);
    if (sources.has(id)) return err("duplicate_source", id);
    sources.set(id, s);
    if (!oneOf(programIds, s.programId)) err("bad_source_program", id);
    if (typeof s.publisher !== "string" || typeof s.title !== "string") err("bad_source_text", id);
    if (!isStringOrNull(s.url) || !isStringOrNull(s.retrieved)) err("bad_source_url", id);
    if (!oneOf(reviewStatuses, s.reviewStatus)) err("bad_review_status", id);
    if (s.reviewStatus === "reviewed" && (!s.url || !s.retrieved)) err("reviewed_without_url", id);
  });

  // Programs
  const seenPrograms = new Set<string>();
  arr("programs").forEach((p, i) => {
    if (!isRecord(p) || !oneOf(programIds, p.id)) return err("bad_program", `programs[${i}]`);
    if (seenPrograms.has(p.id)) return err("duplicate_program", p.id);
    seenPrograms.add(p.id);
    if (!Array.isArray(p.sourceIds) || p.sourceIds.length === 0) return err("program_without_source", p.id);
    for (const sid of p.sourceIds) if (typeof sid !== "string" || !sources.has(sid)) err("unknown_source", p.id, String(sid));
  });

  // Facts
  const facts = new Map<string, Rec>();
  arr("facts").forEach((f, i) => {
    const id = idOf(f, `facts[${i}]`);
    if (!isRecord(f) || !isNonEmptyString(f.id)) return err("bad_fact", id);
    if (facts.has(id)) return err("duplicate_fact", id);
    facts.set(id, f);
    if (!oneOf(factKinds, f.kind)) return err("bad_fact_kind", id);
    if (f.kind === "choice") {
      const ok = Array.isArray(f.options) && f.options.length > 0 && f.options.every(isNonEmptyString) && !f.options.includes("unknown");
      if (!ok) err("bad_fact_options", id);
    }
    if (f.kind === "number" && !(isInt(f.min) && isInt(f.max) && f.min <= f.max)) err("bad_fact_range", id);
    if (f.areaContext !== undefined && f.areaContext !== true) err("bad_area_context", id);
  });

  const valueMatchesFact = (fact: Rec, value: unknown): boolean => {
    switch (fact.kind) {
      case "boolean": return typeof value === "boolean";
      case "number": return isInt(value);
      case "choice": return typeof value === "string" && Array.isArray(fact.options) && fact.options.includes(value);
      case "text": return typeof value === "string" && value !== "unknown";
      case "date": return isIsoDate(value);
      default: return false;
    }
  };

  // Rules
  const rules = new Map<string, Rec>();
  arr("rules").forEach((r, i) => {
    const id = idOf(r, `rules[${i}]`);
    if (!isRecord(r) || !isNonEmptyString(r.id)) return err("bad_rule", id);
    if (rules.has(id)) return err("duplicate_rule", id);
    rules.set(id, r);
    if (!isInt(r.version) || r.version < 1) err("bad_rule_version", id);
    if (!oneOf(programIds, r.programId)) err("bad_rule_program", id);
    if (typeof r.synthetic !== "boolean") err("bad_rule_synthetic", id);

    const cited: Rec[] = [];
    if (!Array.isArray(r.sourceIds) || r.sourceIds.length === 0) err("rule_without_source", id);
    else
      for (const sid of r.sourceIds) {
        const s = typeof sid === "string" ? sources.get(sid) : undefined;
        if (!s) err("unknown_source", id, String(sid));
        else cited.push(s);
      }
    const notReviewed = cited.filter((s) => s.reviewStatus !== "reviewed").map((s) => s.id as string);
    const allCitedFound = Array.isArray(r.sourceIds) && cited.length === r.sourceIds.length;
    if (r.synthetic === false && notReviewed.length > 0) err("nonsynthetic_unreviewed_source", id, ...notReviewed);

    let hasNumericPredicate = false;
    if (!Array.isArray(r.predicates)) err("bad_predicates", id);
    else {
      const predIds = new Set<string>();
      r.predicates.forEach((p, j) => {
        const pid = idOf(p, `${id}.predicates[${j}]`);
        if (!isRecord(p) || !isNonEmptyString(p.id)) return err("bad_predicate", id, pid);
        if (predIds.has(pid)) err("duplicate_predicate", id, pid);
        predIds.add(pid);
        if (p.op !== "equals") err("bad_predicate_op", id, pid);
        if (typeof p.value === "number") hasNumericPredicate = true;
        const fact = typeof p.factId === "string" ? facts.get(p.factId) : undefined;
        if (!fact) return err("unknown_fact", id, String(p.factId));
        if (fact.areaContext === true) err("area_context_predicate", id, String(p.factId));
        if (!valueMatchesFact(fact, p.value)) err("predicate_value_type", id, pid);
      });
    }

    if (r.urgencyTriggerFactId !== null) {
      const f = typeof r.urgencyTriggerFactId === "string" ? facts.get(r.urgencyTriggerFactId) : undefined;
      if (!f || f.kind !== "boolean") err("bad_urgency_trigger", id, String(r.urgencyTriggerFactId));
    }
    if (r.deadline !== null) {
      const d = r.deadline;
      const f = isRecord(d) && typeof d.factId === "string" ? facts.get(d.factId) : undefined;
      if (!isRecord(d) || d.kind !== "offset_from_date_fact" || !isInt(d.offsetDays) || !f || f.kind !== "date") {
        err("bad_deadline", id);
      }
    }

    // No-numbers guard (Req 4.7). A rule citing a missing source is already rejected above.
    if (notReviewed.length > 0 || !allCitedFound) {
      if (r.deadline !== null) err("deadline_without_reviewed_source", id);
      if (hasNumericPredicate) err("number_without_reviewed_source", id);
      const texts = [...collectStrings(r), ...cited.flatMap((s) => collectStrings(s))];
      for (const t of texts) if (NO_NUMBERS_PATTERN.test(t)) err("policy_number_without_reviewed_source", id, t);
    }
  });

  // Actions
  const actions = new Map<string, Rec>();
  const actionsPerProgram = new Map<string, number>();
  arr("actions").forEach((a, i) => {
    const id = idOf(a, `actions[${i}]`);
    if (!isRecord(a) || !isNonEmptyString(a.id)) return err("bad_action", id);
    if (actions.has(id)) return err("duplicate_action", id);
    actions.set(id, a);
    if (!oneOf(programIds, a.programId)) err("bad_action_program", id);
    else actionsPerProgram.set(a.programId, (actionsPerProgram.get(a.programId) ?? 0) + 1);
    const rule = typeof a.ruleId === "string" ? rules.get(a.ruleId) : undefined;
    if (!rule) err("unknown_rule", id, String(a.ruleId));
    else if (rule.programId !== a.programId) err("action_rule_program_mismatch", id, String(a.ruleId));
    if (!isNonEmptyString(a.nextStepKey)) err("bad_next_step", id);
    if (!oneOf(humanHelpOptions, a.humanHelp)) err("bad_human_help", id);
  });
  for (const p of programIds) if (actionsPerProgram.get(p) !== 1) err("action_count", p);

  // Evidence
  const evidenceTypes = new Set<string>();
  arr("evidenceTypes").forEach((e, i) => {
    const id = idOf(e, `evidenceTypes[${i}]`);
    if (!isRecord(e) || !isNonEmptyString(e.id)) return err("bad_evidence_type", id);
    if (evidenceTypes.has(id)) return err("duplicate_evidence_type", id);
    evidenceTypes.add(id);
  });
  const pairs = new Set<string>();
  arr("evidenceRequirements").forEach((q, i) => {
    if (!isRecord(q)) return err("bad_evidence_requirement", `evidenceRequirements[${i}]`);
    const t = String(q.evidenceTypeId);
    const a = String(q.actionId);
    if (!evidenceTypes.has(t)) err("unknown_evidence_type", t);
    if (!actions.has(a)) err("unknown_action", a);
    if (!oneOf(evidenceLevels, q.level)) err("bad_evidence_level", a, t);
    const key = JSON.stringify([t, a]);
    if (pairs.has(key)) err("duplicate_evidence_requirement", t, a);
    pairs.add(key);
  });

  // Edges
  arr("edges").forEach((e, i) => {
    if (!isRecord(e)) return err("bad_edge", `edges[${i}]`);
    const from = String(e.from);
    const to = String(e.to);
    if (!actions.has(from)) err("unknown_edge_endpoint", from);
    if (!actions.has(to)) err("unknown_edge_endpoint", to);
    if (from === to) err("self_edge", from);
    if (!isNonEmptyString(e.reasonKey)) err("bad_edge_reason", from, to);
  });

  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: input as unknown as Fixture };
}

/** The v2 fixture, parsed once at import. UI shows the human-help message when not ok. */
export const fixtureResult: Result<Fixture, FixtureError> = parseFixture(raw);
