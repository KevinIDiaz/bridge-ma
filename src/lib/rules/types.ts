// Shared team contract for Bridge MA.
// Do not change without coordinating with all teammates
// (see .kiro/specs/action-graph/design.md -> "Shared contracts and team boundaries").
// Types only: no runtime code, no React/Next/model-adapter imports.

export type ProgramId = "snap" | "raft" | "utility";
export type ReviewStatus = "reviewed" | "unreviewed" | "stale";
export type Unknown = "unknown";
/** Three-valued result. "unknown" is never treated as false. */
export type TriState = boolean | Unknown;
export type FactId = string;
export type ActionId = string;
/** string = choice option, text, or YYYY-MM-DD */
export type FactValue = boolean | number | string;

export interface ResidentFact {
  id: FactId;
  /** A text input of literal "unknown" is treated as unknown (no rule reads text facts). */
  value: FactValue | Unknown;
  confirmation: "unconfirmed" | "confirmed";
  origin: "user";
}

export interface FactDef {
  id: FactId;
  /** "date" exists for deadline calculation; no v1 intake input uses it. */
  kind: "boolean" | "number" | "choice" | "text" | "date";
  options?: string[];
  min?: number;
  max?: number;
  /** neighborhood: never reaches the engine. */
  areaContext?: true;
}

export interface Source {
  id: string;
  programId: ProgramId;
  publisher: string;
  title: string;
  url: string | null;
  retrieved: string | null;
  reviewStatus: ReviewStatus;
}

export interface Predicate {
  id: string;
  factId: FactId;
  op: "equals";
  value: FactValue;
}

export interface DeadlineCalc {
  kind: "offset_from_date_fact";
  factId: FactId;
  offsetDays: number;
}

export interface RuleVersion {
  id: string;
  version: number;
  programId: ProgramId;
  sourceIds: string[];
  synthetic: boolean;
  /** All required (Kleene AND). Required fact IDs = distinct predicate factIds. */
  predicates: Predicate[];
  urgencyTriggerFactId: FactId | null;
  /** null for every rule in the v2 fixture. */
  deadline: DeadlineCalc | null;
}

export type HumanHelpOption = "legal_aid" | "program_office" | "general_help_line";

export interface ActionDef {
  id: ActionId;
  programId: ProgramId;
  ruleId: string;
  nextStepKey: string;
  humanHelp: HumanHelpOption;
}

/** Label comes from dict.evidence[id]. */
export interface EvidenceType {
  id: string;
}

export interface EvidenceRequirementDef {
  actionId: ActionId;
  evidenceTypeId: string;
  level: "required" | "helpful";
}

export interface EdgeDef {
  from: ActionId;
  to: ActionId;
  reasonKey: string;
}

export interface Fixture {
  version: number;
  fictionalDemo: true;
  sources: Source[];
  programs: { id: ProgramId; sourceIds: string[] }[];
  facts: FactDef[];
  rules: RuleVersion[];
  actions: ActionDef[];
  evidenceTypes: EvidenceType[];
  evidenceRequirements: EvidenceRequirementDef[];
  edges: EdgeDef[];
}

// Engine
export interface EngineFacts {
  confirmed: Readonly<Record<FactId, FactValue | Unknown>>;
  unconfirmedIds: readonly FactId[];
}

export type MatchStatus = "may_match" | "likely_not" | "cant_tell";

export interface PredicateResult {
  predicateId: string;
  factId: FactId;
  result: TriState;
}

export interface ProgramEvaluation {
  programId: ProgramId;
  status: MatchStatus;
  ruleId: string;
  ruleVersion: number;
  fixtureVersion: number;
  predicateResults: PredicateResult[];
  missingFactIds: FactId[];
  unconfirmedFactIds: FactId[];
  sourceIds: string[];
}

// Five independent recommendation dimensions
export type Urgency = "urgent" | "standard" | "unknown";
export type SourceFreshness = ReviewStatus;
export type FactConfirmation = "all_confirmed" | "has_unconfirmed" | "has_missing";
export type ExplanationOrigin = "generated" | "rule_based";

export type Deadline =
  | { kind: "computed"; date: string; ruleId: string; sourceId: string }
  | { kind: "unknown"; reason: "source_unreviewed" | "unsupported" | "facts_unconfirmed" };

export type HandoffTarget =
  | { kind: "portal"; sourceId: string; url: string; publisher: string }
  | { kind: "human"; option: HumanHelpOption };

export interface EvidenceRequirement {
  evidenceTypeId: string;
  level: "required" | "helpful";
  reusedBy: ActionId[];
}

export interface ActionNode {
  id: ActionId;
  programId: ProgramId;
  /** Key into the evaluations array. */
  evaluationRef: ProgramId;
  ruleId: string;
  sourceIds: string[];
  status: MatchStatus;
  urgency: Urgency;
  sourceFreshness: SourceFreshness;
  factConfirmation: FactConfirmation;
  explanationOrigin: ExplanationOrigin;
  nextStepKey: string;
  evidence: EvidenceRequirement[];
  deadline: Deadline;
  handoff: HandoffTarget;
}

export interface ActionEdge {
  from: ActionId;
  to: ActionId;
  reasonKey: string;
}

export interface ActionGraph {
  nodes: ActionNode[];
  edges: ActionEdge[];
}

export interface ReusableEvidence {
  readonly evidenceTypeId: string;
  readonly uses: readonly { actionId: ActionId; level: "required" | "helpful" }[];
  /** True when any using action's RuleVersion is synthetic. */
  readonly synthetic: boolean;
}

export interface HandoffPacket {
  confirmedFacts: ResidentFact[];
  unknownFacts: { factId: FactId; state: "unknown" | "missing" | "unconfirmed" }[];
  actions: ActionNode[];
  evidence: ReusableEvidence[];
  handoffTargets: { actionId: ActionId; target: HandoffTarget }[];
  fixtureVersion: number;
  ruleVersions: { ruleId: string; version: number }[];
  generatedAt: string;
}

export interface Explanation {
  text: string;
  origin: ExplanationOrigin;
}

/** Shared integration contract. Produced only by evaluateBridge; consumed read-only by every UI step. */
export interface BridgeEvaluationResult {
  readonly fixtureVersion: number;
  /** As held in Session_State (including unconfirmed). */
  readonly facts: readonly ResidentFact[];
  /** Exactly 3, order snap, raft, utility. */
  readonly evaluations: readonly ProgramEvaluation[];
  /** Nodes in display order + forward-only edges. */
  readonly graph: ActionGraph;
  /** Deduplicated, first-appearance order. */
  readonly evidence: readonly ReusableEvidence[];
  readonly handoff: HandoffPacket;
}

// Errors
export type Result<T, E> = { ok: true; value: T } | { ok: false; errors: E[] };
/** e.g. { code: "unknown_source", ids: ["R-SNAP", "S-X"] } */
export type FixtureError = { code: string; ids: string[] };
export type EngineError = { kind: "rule_count"; programId: ProgramId };
export type BuildError = { kind: "missing_ref"; ref: "evaluation" | "rule" | "source"; id: string };
export type GraphError =
  | { kind: "duplicate_id"; id: ActionId }
  | { kind: "dangling_edge"; from: ActionId; to: ActionId; absent: "from" | "to" | "both" }
  | { kind: "cycle"; ids: ActionId[] };
export type BridgeError =
  | { kind: "fixture_error"; errors: FixtureError[] }
  | { kind: "engine_error"; errors: EngineError[] }
  | { kind: "build_error"; errors: BuildError[] }
  | { kind: "graph_error"; errors: GraphError[] };