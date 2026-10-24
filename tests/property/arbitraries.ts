// Shared fast-check generators. Fictional data only; nothing here is Massachusetts policy.
import fc from "fast-check";
import { fixtureResult } from "@/lib/data/programs";
import type {
  ActionDef,
  ActionEdge,
  EdgeDef,
  EvidenceRequirementDef,
  FactDef,
  Fixture,
  Predicate,
  ProgramId,
  ResidentFact,
  ReviewStatus,
  RuleVersion,
  Source,
} from "@/lib/rules/types";

export const NUM_RUNS = { numRuns: 100 } as const;
const PROGRAMS: readonly ProgramId[] = ["snap", "raft", "utility"];

export function v2Fixture(): Fixture {
  if (!fixtureResult.ok) throw new Error("v2 fixture invalid");
  return structuredClone(fixtureResult.value);
}

const arbConfirmation = fc.constantFrom<ResidentFact["confirmation"]>("confirmed", "unconfirmed");

/** A value valid for the fact kind, or "unknown". */
export function arbFactValue(def: FactDef): fc.Arbitrary<ResidentFact["value"]> {
  switch (def.kind) {
    case "boolean":
      return fc.constantFrom<ResidentFact["value"]>(true, false, "unknown");
    case "number":
      return fc.oneof(fc.integer({ min: def.min ?? 1, max: def.max ?? 20 }), fc.constant("unknown" as const));
    case "choice":
      return fc.constantFrom<ResidentFact["value"]>(...(def.options ?? []), "unknown");
    case "date":
      return fc.oneof(
        fc.date({ min: new Date("2000-01-01T00:00:00Z"), max: new Date("2099-12-31T00:00:00Z"), noInvalidDate: true }).map((d) => d.toISOString().slice(0, 10)),
        fc.constant("unknown" as const),
      );
    default:
      return fc.oneof(fc.string({ maxLength: 100 }), fc.constant("unknown" as const));
  }
}

/** Each FactDef is either absent or present with a value and a confirmation state. */
export function arbFactSet(defs: readonly FactDef[] = v2Fixture().facts): fc.Arbitrary<ResidentFact[]> {
  return fc
    .tuple(
      ...defs.map((d) =>
        fc.option(
          fc.record({ value: arbFactValue(d), confirmation: arbConfirmation }).map(
            ({ value, confirmation }): ResidentFact => ({ id: d.id, value, confirmation, origin: "user" }),
          ),
          { nil: undefined },
        ),
      ),
    )
    .map((xs) => xs.filter((x): x is ResidentFact => x !== undefined));
}

export interface SourceVariant {
  status: ReviewStatus;
  withUrl: boolean;
}

/** A review status (and whether a URL is present) for each source ID. */
export function arbSourceStatuses(
  ids: readonly string[] = v2Fixture().sources.map((s) => s.id),
  { allowMissingUrl = false } = {},
): fc.Arbitrary<Record<string, SourceVariant>> {
  const variant = fc.record({
    status: fc.constantFrom<ReviewStatus>("reviewed", "unreviewed", "stale"),
    withUrl: allowMissingUrl ? fc.boolean() : fc.constant(true),
  });
  return fc.tuple(...ids.map(() => variant)).map((vs) => Object.fromEntries(ids.map((id, i) => [id, vs[i]])));
}

/** Derives a fixture whose sources carry the given statuses. Reviewed sources get a fictional URL and date. */
export function withSourceStatuses(fixture: Fixture, statuses: Record<string, SourceVariant>): Fixture {
  const f = structuredClone(fixture);
  f.sources = f.sources.map((s): Source => {
    const v = statuses[s.id];
    if (!v) return s;
    const reviewed = v.status === "reviewed";
    return {
      ...s,
      reviewStatus: v.status,
      url: reviewed && v.withUrl ? `https://example.org/fictional/${s.id.toLowerCase()}` : null,
      retrieved: reviewed ? "2026-01-01" : null,
    };
  });
  return f;
}

// ---------- Valid schema fixtures (Property 18) ----------

const arbProgramFixturePart = (program: ProgramId, booleanFacts: string[], numberFact: string) =>
  fc
    .record({
      reviewed: fc.boolean(),
      nonReviewedStatus: fc.constantFrom<ReviewStatus>("unreviewed", "stale"),
      sourceCount: fc.integer({ min: 1, max: 2 }),
      predicateFacts: fc.uniqueArray(fc.constantFrom(...booleanFacts), { minLength: 1, maxLength: booleanFacts.length }),
      predicateValues: fc.array(fc.boolean(), { minLength: booleanFacts.length, maxLength: booleanFacts.length }),
      numberPredicate: fc.option(fc.integer({ min: 1, max: 20 }), { nil: undefined }),
      trigger: fc.option(fc.constantFrom(...booleanFacts), { nil: null }),
      deadlineOffset: fc.option(fc.integer({ min: 0, max: 365 }), { nil: null }),
      synthetic: fc.boolean(),
      version: fc.integer({ min: 1, max: 9 }),
      humanHelp: fc.constantFrom<ActionDef["humanHelp"]>("legal_aid", "program_office", "general_help_line"),
    })
    .map((p) => {
      const sources: Source[] = Array.from({ length: p.sourceCount }, (_, i) => ({
        id: `S-${program}-${String.fromCharCode(97 + i)}`,
        programId: program,
        publisher: "Fictional publisher",
        title: `Fictional source for ${program}`,
        url: p.reviewed ? `https://example.org/fictional/${program}` : null,
        retrieved: p.reviewed ? "2026-01-01" : null,
        reviewStatus: p.reviewed ? "reviewed" : p.nonReviewedStatus,
      }));
      const predicates: Predicate[] = p.predicateFacts.map((factId, i) => ({
        id: `P-${program}-${factId}`,
        factId,
        op: "equals",
        value: p.predicateValues[i],
      }));
      if (p.reviewed && p.numberPredicate !== undefined) {
        predicates.push({ id: `P-${program}-num`, factId: numberFact, op: "equals", value: p.numberPredicate });
      }
      const rule: RuleVersion = {
        id: `R-${program}`,
        version: p.version,
        programId: program,
        sourceIds: sources.map((s) => s.id),
        synthetic: p.reviewed ? p.synthetic : true,
        predicates,
        urgencyTriggerFactId: p.trigger,
        deadline:
          p.reviewed && p.deadlineOffset !== null
            ? { kind: "offset_from_date_fact", factId: "start_date", offsetDays: p.deadlineOffset }
            : null,
      };
      const action: ActionDef = {
        id: `A-${program}`,
        programId: program,
        ruleId: rule.id,
        nextStepKey: `nextStep.${program}`,
        humanHelp: p.humanHelp,
      };
      return { sources, rule, action };
    });

export const arbFixture: fc.Arbitrary<Fixture> = fc
  .record({
    version: fc.integer({ min: 1, max: 99 }),
    booleanCount: fc.integer({ min: 1, max: 5 }),
    evidenceCount: fc.integer({ min: 0, max: 4 }),
  })
  .chain(({ version, booleanCount, evidenceCount }) => {
    const booleanFacts = Array.from({ length: booleanCount }, (_, i) => `flag_${String.fromCharCode(97 + i)}`);
    const facts: FactDef[] = [
      ...booleanFacts.map((id): FactDef => ({ id, kind: "boolean" })),
      { id: "size", kind: "number", min: 1, max: 20 },
      { id: "lang", kind: "choice", options: ["en", "es"] },
      { id: "note", kind: "text" },
      { id: "area", kind: "text", areaContext: true },
      { id: "start_date", kind: "date" },
    ];
    const evidenceIds = Array.from({ length: evidenceCount }, (_, i) => `E-${String.fromCharCode(97 + i)}`);
    const actionIds = PROGRAMS.map((p) => `A-${p}`);
    const pairs = actionIds.flatMap((a) => evidenceIds.map((e) => [a, e] as const));
    const directed = actionIds.flatMap((a) => actionIds.filter((b) => b !== a).map((b) => [a, b] as const));

    return fc
      .record({
        parts: fc.tuple(...PROGRAMS.map((p) => arbProgramFixturePart(p, booleanFacts, "size"))),
        reqs: pairs.length > 0 ? fc.subarray(pairs) : fc.constant([] as (readonly [string, string])[]),
        levels: fc.array(fc.constantFrom<"required" | "helpful">("required", "helpful"), { minLength: pairs.length, maxLength: pairs.length }),
        edges: fc.subarray(directed),
      })
      .map(({ parts, reqs, levels, edges }): Fixture => ({
        version,
        fictionalDemo: true,
        sources: parts.flatMap((p) => p.sources),
        programs: parts.map((p, i) => ({ id: PROGRAMS[i], sourceIds: p.sources.map((s) => s.id) })),
        facts,
        rules: parts.map((p) => p.rule),
        actions: parts.map((p) => p.action),
        evidenceTypes: evidenceIds.map((id) => ({ id })),
        evidenceRequirements: reqs.map(([actionId, evidenceTypeId], i): EvidenceRequirementDef => ({
          actionId,
          evidenceTypeId,
          level: levels[i],
        })),
        edges: edges.map(([from, to]): EdgeDef => ({ from, to, reasonKey: "edge.test" })),
      }));
  });

// ---------- Graphs for validator properties ----------

const edge = (from: string, to: string): ActionEdge => ({ from, to, reasonKey: "edge.test" });

/** 1-10 nodes with IDs from a pool of 5 (duplicates likely), 0-20 edges over the pool. */
export const arbGraphWithDuplicates = fc
  .record({
    nodes: fc.array(fc.constantFrom("N0", "N1", "N2", "N3", "N4"), { minLength: 1, maxLength: 10 }),
    edges: fc.array(fc.tuple(fc.constantFrom("N0", "N1", "N2", "N3", "N4"), fc.constantFrom("N0", "N1", "N2", "N3", "N4")), { maxLength: 20 }),
  })
  .map(({ nodes, edges }) => ({ nodes: nodes.map((id) => ({ id })), edges: edges.map(([a, b]) => edge(a, b)) }));

const uniqueIds = fc.integer({ min: 1, max: 10 }).map((n) => Array.from({ length: n }, (_, i) => `N${i}`));

/** 1-10 unique nodes; edge endpoints from the node IDs plus 3 absent IDs. */
export const arbGraphWithDangling = uniqueIds.chain((ids) => {
  const pool = [...ids, "X0", "X1", "X2"];
  return fc
    .array(fc.tuple(fc.constantFrom(...pool), fc.constantFrom(...pool)), { maxLength: 20 })
    .map((es) => ({ nodes: ids.map((id) => ({ id })), edges: es.map(([a, b]) => edge(a, b)), absent: new Set(["X0", "X1", "X2"]) }));
});

/** 1-10 unique nodes; 0-20 edges between existing IDs (self-loops included). */
export const arbGraphForCycles = uniqueIds.chain((ids) =>
  fc
    .array(fc.tuple(fc.constantFrom(...ids), fc.constantFrom(...ids)), { maxLength: 20 })
    .map((es) => ({ nodes: ids.map((id) => ({ id })), edges: es.map(([a, b]) => edge(a, b)) })),
);
