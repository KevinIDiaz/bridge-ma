import raw from "@/fixtures/programs.v1.json";

export const programIds = ["snap", "raft", "utility"] as const;
export type ProgramId = (typeof programIds)[number];

export const reviewStatuses = ["unreviewed", "reviewed", "stale"] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];

export interface Source {
  id: string;
  programId: ProgramId;
  publisher: string;
  title: string;
  url: string | null;
  retrieved: string | null;
  reviewStatus: ReviewStatus;
}

export interface Program {
  id: ProgramId;
  sourceIds: string[];
}

export interface ProgramFixture {
  version: number;
  fictionalDemo: true;
  sources: Source[];
  programs: Program[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isStringOrNull = (v: unknown): v is string | null => v === null || typeof v === "string";
const isProgramId = (v: unknown): v is ProgramId => (programIds as readonly unknown[]).includes(v);
const isReviewStatus = (v: unknown): v is ReviewStatus => (reviewStatuses as readonly unknown[]).includes(v);

/**
 * Validates fixture shape and provenance links. Throws on the first problem.
 * A `reviewed` source must have a URL and retrieval date.
 */
export function parseProgramFixture(input: unknown): ProgramFixture {
  if (!isRecord(input)) throw new Error("fixture: not an object");
  if (typeof input.version !== "number" || !Number.isInteger(input.version) || input.version < 1) {
    throw new Error("fixture: version must be a positive integer");
  }
  if (input.fictionalDemo !== true) throw new Error("fixture: fictionalDemo must be true");
  if (!Array.isArray(input.sources) || !Array.isArray(input.programs)) {
    throw new Error("fixture: sources and programs must be arrays");
  }

  const sourceIds = new Set<string>();
  for (const s of input.sources) {
    if (!isRecord(s) || typeof s.id !== "string" || s.id === "") throw new Error("source: missing id");
    if (sourceIds.has(s.id)) throw new Error(`source ${s.id}: duplicate id`);
    if (!isProgramId(s.programId)) throw new Error(`source ${s.id}: unknown programId`);
    if (typeof s.publisher !== "string" || typeof s.title !== "string") throw new Error(`source ${s.id}: missing publisher/title`);
    if (!isStringOrNull(s.url) || !isStringOrNull(s.retrieved)) throw new Error(`source ${s.id}: bad url/retrieved`);
    if (!isReviewStatus(s.reviewStatus)) throw new Error(`source ${s.id}: unknown reviewStatus`);
    if (s.reviewStatus === "reviewed" && (!s.url || !s.retrieved)) {
      throw new Error(`source ${s.id}: reviewed sources need url and retrieved date`);
    }
    sourceIds.add(s.id);
  }

  const seenPrograms = new Set<string>();
  for (const p of input.programs) {
    if (!isRecord(p) || !isProgramId(p.id)) throw new Error("program: unknown id");
    if (seenPrograms.has(p.id)) throw new Error(`program ${p.id}: duplicate id`);
    if (!Array.isArray(p.sourceIds) || p.sourceIds.length === 0) throw new Error(`program ${p.id}: needs at least one source`);
    for (const id of p.sourceIds) {
      if (typeof id !== "string" || !sourceIds.has(id)) throw new Error(`program ${p.id}: unknown source ${String(id)}`);
    }
    seenPrograms.add(p.id);
  }

  return input as unknown as ProgramFixture;
}

export const programFixture: ProgramFixture = parseProgramFixture(raw);
