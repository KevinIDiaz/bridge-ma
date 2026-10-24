// TEMPORARY pre-integration stub (Teammate 2, feature/action-plan-handoff).
//
// Hand-written, typed data that matches the shared contract in src/lib/rules/types.ts.
// It mirrors the design's "Expected demo outcome" table for the fictional persona after
// every fact is confirmed. Nothing here is computed: the UI only presents it.
//
// Assumptions (from .kiro/specs/action-graph/design.md, "Data Models"):
// - Fixture version 2; three Sources copied from programs.v1.json, all `unreviewed`, URL null.
// - Rules R-SNAP / R-RAFT / R-UTIL v1, all synthetic, deadline null.
// - Predicate IDs (P-*) are invented for the stub; the real fixture may name them differently.
// - HandoffPacket.confirmedFacts leaves out `neighborhood` and facts whose value is `unknown`
//   (those appear in unknownFacts instead). The Lead's buildHandoffPacket decides the real rule.
//
// Delete this file at integration, when `evaluateBridge` and `fixtureResult` are available.
import type { BridgeEvaluationResult, Fixture, ResidentFact } from "@/lib/rules/types";

export const STUB_FIXTURE: Fixture = {
  version: 2,
  fictionalDemo: true,
  sources: [
    {
      id: "S-SNAP-01",
      programId: "snap",
      publisher: "MA Department of Transitional Assistance",
      title: "SNAP eligibility and application",
      url: null,
      retrieved: null,
      reviewStatus: "unreviewed",
    },
    {
      id: "S-RAFT-01",
      programId: "raft",
      publisher: "MA Executive Office of Housing and Livable Communities",
      title: "RAFT program overview",
      url: null,
      retrieved: null,
      reviewStatus: "unreviewed",
    },
    {
      id: "S-UTIL-01",
      programId: "utility",
      publisher: "MA Department of Public Utilities",
      title: "Shutoff protections",
      url: null,
      retrieved: null,
      reviewStatus: "unreviewed",
    },
  ],
  programs: [
    { id: "snap", sourceIds: ["S-SNAP-01"] },
    { id: "raft", sourceIds: ["S-RAFT-01"] },
    { id: "utility", sourceIds: ["S-UTIL-01"] },
  ],
  facts: [
    { id: "preferred_language", kind: "choice", options: ["en", "es"] },
    { id: "city", kind: "text" },
    { id: "neighborhood", kind: "text", areaContext: true },
    { id: "household_size", kind: "number", min: 1, max: 20 },
    { id: "single_parent", kind: "boolean" },
    { id: "lives_in_ma", kind: "boolean" },
    { id: "lost_job_recently", kind: "boolean" },
    { id: "rents_home", kind: "boolean" },
    { id: "received_notice_to_quit", kind: "boolean" },
    { id: "has_utility_account", kind: "boolean" },
    { id: "received_shutoff_notice", kind: "boolean" },
  ],
  rules: [
    {
      id: "R-SNAP",
      version: 1,
      programId: "snap",
      sourceIds: ["S-SNAP-01"],
      synthetic: true,
      predicates: [
        { id: "P-SNAP-1", factId: "lives_in_ma", op: "equals", value: true },
        { id: "P-SNAP-2", factId: "lost_job_recently", op: "equals", value: true },
      ],
      urgencyTriggerFactId: null,
      deadline: null,
    },
    {
      id: "R-RAFT",
      version: 1,
      programId: "raft",
      sourceIds: ["S-RAFT-01"],
      synthetic: true,
      predicates: [
        { id: "P-RAFT-1", factId: "lives_in_ma", op: "equals", value: true },
        { id: "P-RAFT-2", factId: "rents_home", op: "equals", value: true },
        { id: "P-RAFT-3", factId: "received_notice_to_quit", op: "equals", value: true },
      ],
      urgencyTriggerFactId: "received_notice_to_quit",
      deadline: null,
    },
    {
      id: "R-UTIL",
      version: 1,
      programId: "utility",
      sourceIds: ["S-UTIL-01"],
      synthetic: true,
      predicates: [
        { id: "P-UTIL-1", factId: "lives_in_ma", op: "equals", value: true },
        { id: "P-UTIL-2", factId: "has_utility_account", op: "equals", value: true },
        { id: "P-UTIL-3", factId: "received_shutoff_notice", op: "equals", value: true },
      ],
      urgencyTriggerFactId: "received_shutoff_notice",
      deadline: null,
    },
  ],
  actions: [
    { id: "A-SNAP", programId: "snap", ruleId: "R-SNAP", nextStepKey: "nextStep.snap", humanHelp: "program_office" },
    { id: "A-RAFT", programId: "raft", ruleId: "R-RAFT", nextStepKey: "nextStep.raft", humanHelp: "legal_aid" },
    { id: "A-UTIL", programId: "utility", ruleId: "R-UTIL", nextStepKey: "nextStep.utility", humanHelp: "general_help_line" },
  ],
  evidenceTypes: [
    { id: "E-ID" },
    { id: "E-JOB-LOSS" },
    { id: "E-HOUSEHOLD" },
    { id: "E-NTQ" },
    { id: "E-LEASE" },
    { id: "E-UTIL-BILL" },
  ],
  evidenceRequirements: [
    { actionId: "A-SNAP", evidenceTypeId: "E-ID", level: "required" },
    { actionId: "A-SNAP", evidenceTypeId: "E-JOB-LOSS", level: "required" },
    { actionId: "A-SNAP", evidenceTypeId: "E-HOUSEHOLD", level: "helpful" },
    { actionId: "A-RAFT", evidenceTypeId: "E-ID", level: "required" },
    { actionId: "A-RAFT", evidenceTypeId: "E-NTQ", level: "required" },
    { actionId: "A-RAFT", evidenceTypeId: "E-LEASE", level: "required" },
    { actionId: "A-RAFT", evidenceTypeId: "E-JOB-LOSS", level: "helpful" },
    { actionId: "A-UTIL", evidenceTypeId: "E-ID", level: "required" },
    { actionId: "A-UTIL", evidenceTypeId: "E-UTIL-BILL", level: "required" },
    { actionId: "A-UTIL", evidenceTypeId: "E-JOB-LOSS", level: "helpful" },
  ],
  edges: [
    { from: "A-RAFT", to: "A-SNAP", reasonKey: "edge.housing_first" },
    { from: "A-RAFT", to: "A-UTIL", reasonKey: "edge.housing_first" },
  ],
};

const confirmed = (id: string, value: ResidentFact["value"]): ResidentFact => ({
  id,
  value,
  confirmation: "confirmed",
  origin: "user",
});

/** Demo persona from the design, every fact confirmed. */
const STUB_FACTS: ResidentFact[] = [
  confirmed("preferred_language", "es"),
  confirmed("city", "Boston"),
  confirmed("neighborhood", "unknown"),
  confirmed("household_size", 2),
  confirmed("single_parent", true),
  confirmed("lives_in_ma", true),
  confirmed("lost_job_recently", true),
  confirmed("rents_home", true),
  confirmed("received_notice_to_quit", true),
  confirmed("has_utility_account", true),
  confirmed("received_shutoff_notice", "unknown"),
];

const nodes: BridgeEvaluationResult["graph"]["nodes"] = [
  {
    id: "A-RAFT",
    programId: "raft",
    evaluationRef: "raft",
    ruleId: "R-RAFT",
    sourceIds: ["S-RAFT-01"],
    status: "may_match",
    urgency: "urgent",
    sourceFreshness: "unreviewed",
    factConfirmation: "all_confirmed",
    explanationOrigin: "rule_based",
    nextStepKey: "nextStep.raft",
    evidence: [
      { evidenceTypeId: "E-ID", level: "required", reusedBy: ["A-SNAP", "A-UTIL"] },
      { evidenceTypeId: "E-NTQ", level: "required", reusedBy: [] },
      { evidenceTypeId: "E-LEASE", level: "required", reusedBy: [] },
      { evidenceTypeId: "E-JOB-LOSS", level: "helpful", reusedBy: ["A-SNAP", "A-UTIL"] },
    ],
    deadline: { kind: "unknown", reason: "source_unreviewed" },
    handoff: { kind: "human", option: "legal_aid" },
  },
  {
    id: "A-SNAP",
    programId: "snap",
    evaluationRef: "snap",
    ruleId: "R-SNAP",
    sourceIds: ["S-SNAP-01"],
    status: "may_match",
    urgency: "standard",
    sourceFreshness: "unreviewed",
    factConfirmation: "all_confirmed",
    explanationOrigin: "rule_based",
    nextStepKey: "nextStep.snap",
    evidence: [
      { evidenceTypeId: "E-ID", level: "required", reusedBy: ["A-RAFT", "A-UTIL"] },
      { evidenceTypeId: "E-JOB-LOSS", level: "required", reusedBy: ["A-RAFT", "A-UTIL"] },
      { evidenceTypeId: "E-HOUSEHOLD", level: "helpful", reusedBy: [] },
    ],
    deadline: { kind: "unknown", reason: "source_unreviewed" },
    handoff: { kind: "human", option: "program_office" },
  },
  {
    id: "A-UTIL",
    programId: "utility",
    evaluationRef: "utility",
    ruleId: "R-UTIL",
    sourceIds: ["S-UTIL-01"],
    status: "cant_tell",
    urgency: "unknown",
    sourceFreshness: "unreviewed",
    factConfirmation: "has_missing",
    explanationOrigin: "rule_based",
    nextStepKey: "nextStep.utility",
    evidence: [
      { evidenceTypeId: "E-ID", level: "required", reusedBy: ["A-RAFT", "A-SNAP"] },
      { evidenceTypeId: "E-UTIL-BILL", level: "required", reusedBy: [] },
      { evidenceTypeId: "E-JOB-LOSS", level: "helpful", reusedBy: ["A-RAFT", "A-SNAP"] },
    ],
    deadline: { kind: "unknown", reason: "source_unreviewed" },
    handoff: { kind: "human", option: "general_help_line" },
  },
];

const edges: BridgeEvaluationResult["graph"]["edges"] = [
  { from: "A-RAFT", to: "A-SNAP", reasonKey: "edge.housing_first" },
  { from: "A-RAFT", to: "A-UTIL", reasonKey: "edge.housing_first" },
];

const evidence: BridgeEvaluationResult["evidence"] = [
  {
    evidenceTypeId: "E-ID",
    uses: [
      { actionId: "A-RAFT", level: "required" },
      { actionId: "A-SNAP", level: "required" },
      { actionId: "A-UTIL", level: "required" },
    ],
    synthetic: true,
  },
  { evidenceTypeId: "E-NTQ", uses: [{ actionId: "A-RAFT", level: "required" }], synthetic: true },
  { evidenceTypeId: "E-LEASE", uses: [{ actionId: "A-RAFT", level: "required" }], synthetic: true },
  {
    evidenceTypeId: "E-JOB-LOSS",
    uses: [
      { actionId: "A-RAFT", level: "helpful" },
      { actionId: "A-SNAP", level: "required" },
      { actionId: "A-UTIL", level: "helpful" },
    ],
    synthetic: true,
  },
  { evidenceTypeId: "E-HOUSEHOLD", uses: [{ actionId: "A-SNAP", level: "helpful" }], synthetic: true },
  { evidenceTypeId: "E-UTIL-BILL", uses: [{ actionId: "A-UTIL", level: "required" }], synthetic: true },
];

/** Fixed date so the stub is deterministic; the adapter replaces it with the local date. */
export const STUB_GENERATED_AT = "2026-10-24";

export const STUB_RESULT: BridgeEvaluationResult = {
  fixtureVersion: 2,
  facts: STUB_FACTS,
  evaluations: [
    {
      programId: "snap",
      status: "may_match",
      ruleId: "R-SNAP",
      ruleVersion: 1,
      fixtureVersion: 2,
      predicateResults: [
        { predicateId: "P-SNAP-1", factId: "lives_in_ma", result: true },
        { predicateId: "P-SNAP-2", factId: "lost_job_recently", result: true },
      ],
      missingFactIds: [],
      unconfirmedFactIds: [],
      sourceIds: ["S-SNAP-01"],
    },
    {
      programId: "raft",
      status: "may_match",
      ruleId: "R-RAFT",
      ruleVersion: 1,
      fixtureVersion: 2,
      predicateResults: [
        { predicateId: "P-RAFT-1", factId: "lives_in_ma", result: true },
        { predicateId: "P-RAFT-2", factId: "rents_home", result: true },
        { predicateId: "P-RAFT-3", factId: "received_notice_to_quit", result: true },
      ],
      missingFactIds: [],
      unconfirmedFactIds: [],
      sourceIds: ["S-RAFT-01"],
    },
    {
      programId: "utility",
      status: "cant_tell",
      ruleId: "R-UTIL",
      ruleVersion: 1,
      fixtureVersion: 2,
      predicateResults: [
        { predicateId: "P-UTIL-1", factId: "lives_in_ma", result: true },
        { predicateId: "P-UTIL-2", factId: "has_utility_account", result: true },
        { predicateId: "P-UTIL-3", factId: "received_shutoff_notice", result: "unknown" },
      ],
      missingFactIds: ["received_shutoff_notice"],
      unconfirmedFactIds: [],
      sourceIds: ["S-UTIL-01"],
    },
  ],
  graph: { nodes, edges },
  evidence,
  handoff: {
    confirmedFacts: STUB_FACTS.filter((f) => f.id !== "neighborhood" && f.value !== "unknown"),
    unknownFacts: [{ factId: "received_shutoff_notice", state: "unknown" }],
    actions: nodes,
    evidence: [...evidence],
    handoffTargets: nodes.map((n) => ({ actionId: n.id, target: n.handoff })),
    fixtureVersion: 2,
    ruleVersions: [
      { ruleId: "R-RAFT", version: 1 },
      { ruleId: "R-SNAP", version: 1 },
      { ruleId: "R-UTIL", version: 1 },
    ],
    generatedAt: STUB_GENERATED_AT,
  },
};
