// Localizer: pure functions that turn an already-computed BridgeEvaluationResult into
// display strings for one locale. React-free and Next-free so unit and property tests can run it.
//
// Rules (Req 12.3): every structured field (IDs, status, the five dimensions, rule and fixture
// versions, deadline, edges) is passed through unchanged. Only display text depends on the
// dictionary. Nothing here decides matching, urgency, deadlines, or graph relationships.
import type {
  ActionEdge,
  ActionId,
  ActionNode,
  BridgeEvaluationResult,
  Deadline,
  ExplanationOrigin,
  FactConfirmation,
  FactId,
  Fixture,
  HandoffPacket,
  HandoffTarget,
  HumanHelpOption,
  MatchStatus,
  ProgramEvaluation,
  ProgramId,
  ResidentFact,
  ReviewStatus,
  SourceFreshness,
  Urgency,
} from "@/lib/rules/types";
import type { Dictionary, Locale } from "./index";

// ---------------------------------------------------------------------------
// Dictionary access

/**
 * Looks up a dotted key such as "reason.R-SNAP.may_match".
 * Returns the key itself when it is absent so a missing translation is visible, never blank.
 * Dynamic lookup is needed because some keys are data-driven (rule IDs, fact IDs, nextStepKey)
 * and some namespaces (facts.*, factOptions.*, value.*) are owned by Teammate 1.
 */
export function t(dict: Dictionary, key: string): string {
  let node: unknown = dict;
  for (const part of key.split(".")) {
    if (node === null || typeof node !== "object" || !(part in node)) return key;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : key;
}

/** Replaces `{name}` placeholders. Unknown placeholders are left as-is so they stay visible. */
export function format(template: string, vars: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole,
  );
}

/** Placeholder names in a template, e.g. "Rule {ruleId}" → ["ruleId"]. Used by the locale validator. */
export function placeholders(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

// ---------------------------------------------------------------------------
// Small shared view models

export type DimensionName = "status" | "urgency" | "sourceFreshness" | "factConfirmation" | "explanationOrigin";

export interface DimensionView {
  name: DimensionName;
  /** Structured value, unchanged. */
  value: MatchStatus | Urgency | SourceFreshness | FactConfirmation | ExplanationOrigin;
  label: string;
  valueLabel: string;
}

export interface FactLabel {
  factId: FactId;
  label: string;
}

export interface SourceView {
  id: string;
  publisher: string;
  title: string;
  reviewStatus: ReviewStatus;
  freshnessLabel: string;
  /** True for `unreviewed` and `stale`: shown with the "Unverified" label and never linked. */
  unverified: boolean;
  unverifiedLabel: string | null;
  /** Only a `reviewed` source with a URL is linked. */
  url: string | null;
  /** Source text is stored in English; set to "en" when the page locale is not English (Req 15.9). */
  lang: "en" | undefined;
}

export interface HandoffTargetView {
  target: HandoffTarget;
  kind: HandoffTarget["kind"];
  text: string;
  /** Present only for a portal target, which the Graph_Builder only creates from a reviewed Source. */
  url: string | null;
}

export interface EvidenceUseView {
  actionId: ActionId;
  programId: ProgramId | null;
  name: string;
  level: "required" | "helpful";
  levelLabel: string;
}

const programName = (dict: Dictionary, programId: ProgramId | null, fallback: string) =>
  programId ? t(dict, `program.${programId}`) : fallback;

/** actionId → programId lookup from the graph. A lookup only; no relationship is derived. */
function programOf(nodes: readonly ActionNode[]): (id: ActionId) => ProgramId | null {
  const map = new Map(nodes.map((n) => [n.id, n.programId]));
  return (id) => map.get(id) ?? null;
}

export function factLabel(dict: Dictionary, factId: FactId): FactLabel {
  return { factId, label: t(dict, `facts.${factId}`) };
}

/** Display text for a fact value. `unknown` gets its own label and is never shown as "No". */
export function factValueLabel(dict: Dictionary, fact: Pick<ResidentFact, "id" | "value">): string {
  const v = fact.value;
  if (v === "unknown") return t(dict, "value.unknown");
  if (v === true) return t(dict, "value.true");
  if (v === false) return t(dict, "value.false");
  if (typeof v === "number") return String(v);
  const option = t(dict, `factOptions.${fact.id}.${v}`);
  return option === `factOptions.${fact.id}.${v}` ? v : option;
}

export function dimensionsOf(dict: Dictionary, node: ActionNode): DimensionView[] {
  return [
    { name: "status", value: node.status, label: t(dict, "dimension.status"), valueLabel: t(dict, `status.${node.status}`) },
    {
      name: "urgency",
      value: node.urgency,
      label: t(dict, "dimension.urgency"),
      valueLabel: t(dict, `dimensionValue.urgency.${node.urgency}`),
    },
    {
      name: "sourceFreshness",
      value: node.sourceFreshness,
      label: t(dict, "dimension.sourceFreshness"),
      valueLabel: t(dict, `dimensionValue.sourceFreshness.${node.sourceFreshness}`),
    },
    {
      name: "factConfirmation",
      value: node.factConfirmation,
      label: t(dict, "dimension.factConfirmation"),
      valueLabel: t(dict, `dimensionValue.factConfirmation.${node.factConfirmation}`),
    },
    {
      name: "explanationOrigin",
      value: node.explanationOrigin,
      label: t(dict, "dimension.explanationOrigin"),
      valueLabel: t(dict, `dimensionValue.explanationOrigin.${node.explanationOrigin}`),
    },
  ];
}

export function deadlineText(dict: Dictionary, deadline: Deadline): string {
  if (deadline.kind === "unknown") return t(dict, "deadline.unknown");
  return format(t(dict, "deadline.computed"), {
    date: deadline.date,
    ruleId: deadline.ruleId,
    sourceId: deadline.sourceId,
  });
}

export function handoffTargetView(dict: Dictionary, target: HandoffTarget): HandoffTargetView {
  if (target.kind === "portal") {
    return {
      target,
      kind: "portal",
      text: `${target.publisher} (${t(dict, "labels.externalOfficialPage")})`,
      url: target.url,
    };
  }
  return { target, kind: "human", text: t(dict, `humanHelp.${target.option}`), url: null };
}

export function sourceView(dict: Dictionary, locale: Locale, fixture: Fixture, sourceId: string): SourceView {
  const s = fixture.sources.find((x) => x.id === sourceId);
  const reviewStatus: ReviewStatus = s?.reviewStatus ?? "unreviewed";
  const unverified = reviewStatus !== "reviewed";
  return {
    id: sourceId,
    publisher: s?.publisher ?? sourceId,
    title: s?.title ?? "",
    reviewStatus,
    freshnessLabel: t(dict, `dimensionValue.sourceFreshness.${reviewStatus}`),
    unverified,
    unverifiedLabel: unverified ? t(dict, "labels.unverified") : null,
    url: !unverified && s?.url ? s.url : null,
    lang: locale === "en" ? undefined : "en",
  };
}

const isSyntheticRule = (fixture: Fixture, ruleId: string) =>
  fixture.rules.find((r) => r.id === ruleId)?.synthetic ?? true;

// ---------------------------------------------------------------------------
// Step 3: action cards

export interface ActionCardView {
  // Structured fields, passed through unchanged.
  id: ActionId;
  programId: ProgramId;
  status: MatchStatus;
  urgency: Urgency;
  sourceFreshness: SourceFreshness;
  factConfirmation: FactConfirmation;
  explanationOrigin: ExplanationOrigin;
  ruleId: string;
  ruleVersion: number;
  fixtureVersion: number;
  sourceIds: string[];
  deadline: Deadline;
  missingFactIds: FactId[];
  unconfirmedFactIds: FactId[];
  edgesIn: ActionEdge[];
  // Display text.
  title: string;
  statusLabel: string;
  ruleBasedLabel: string;
  ruleLine: string;
  why: string;
  dimensions: DimensionView[];
  missing: FactLabel[];
  unconfirmed: FactLabel[];
  /** Shown instead of empty lists when nothing is missing or unconfirmed (Req 7.4). */
  noneMissing: string | null;
  nextStep: string;
  handoff: HandoffTargetView;
  deadlineText: string;
  sources: SourceView[];
  synthetic: boolean;
  syntheticLabel: string | null;
  evidence: {
    evidenceTypeId: string;
    label: string;
    level: "required" | "helpful";
    levelLabel: string;
    reusedBy: EvidenceUseView[];
    reuseText: string;
  }[];
  order: { from: ActionId; fromName: string; reasonText: string; text: string }[];
}

export function localizeActionCard(
  dict: Dictionary,
  locale: Locale,
  node: ActionNode,
  evaluation: ProgramEvaluation,
  graph: BridgeEvaluationResult["graph"],
  fixture: Fixture,
): ActionCardView {
  const programFor = programOf(graph.nodes);
  const synthetic = isSyntheticRule(fixture, node.ruleId);
  const edgesIn = graph.edges.filter((e) => e.to === node.id);
  const missing = evaluation.missingFactIds.map((id) => factLabel(dict, id));
  const unconfirmed = evaluation.unconfirmedFactIds.map((id) => factLabel(dict, id));

  return {
    id: node.id,
    programId: node.programId,
    status: node.status,
    urgency: node.urgency,
    sourceFreshness: node.sourceFreshness,
    factConfirmation: node.factConfirmation,
    explanationOrigin: node.explanationOrigin,
    ruleId: evaluation.ruleId,
    ruleVersion: evaluation.ruleVersion,
    fixtureVersion: evaluation.fixtureVersion,
    sourceIds: [...node.sourceIds],
    deadline: node.deadline,
    missingFactIds: [...evaluation.missingFactIds],
    unconfirmedFactIds: [...evaluation.unconfirmedFactIds],
    edgesIn,

    title: t(dict, `program.${node.programId}`),
    statusLabel: t(dict, `status.${node.status}`),
    ruleBasedLabel: t(dict, "labels.ruleBasedResult"),
    ruleLine: format(t(dict, "actions.ruleLine"), {
      ruleId: evaluation.ruleId,
      ruleVersion: evaluation.ruleVersion,
      fixtureVersion: evaluation.fixtureVersion,
    }),
    why: t(dict, `reason.${evaluation.ruleId}.${evaluation.status}`),
    dimensions: dimensionsOf(dict, node),
    missing,
    unconfirmed,
    noneMissing: missing.length === 0 && unconfirmed.length === 0 ? t(dict, "actions.noneMissing") : null,
    nextStep: t(dict, node.nextStepKey),
    handoff: handoffTargetView(dict, node.handoff),
    deadlineText: deadlineText(dict, node.deadline),
    sources: node.sourceIds.map((id) => sourceView(dict, locale, fixture, id)),
    synthetic,
    syntheticLabel: synthetic ? t(dict, "labels.syntheticRule") : null,
    evidence: node.evidence.map((req) => {
      const reusedBy = req.reusedBy.map((actionId) => {
        const programId = programFor(actionId);
        const use = graph.nodes.find((n) => n.id === actionId)?.evidence.find((e) => e.evidenceTypeId === req.evidenceTypeId);
        const level = use?.level ?? req.level;
        return {
          actionId,
          programId,
          name: programName(dict, programId, actionId),
          level,
          levelLabel: t(dict, `level.${level}`),
        };
      });
      return {
        evidenceTypeId: req.evidenceTypeId,
        label: t(dict, `evidence.${req.evidenceTypeId}`),
        level: req.level,
        levelLabel: t(dict, `level.${req.level}`),
        reusedBy,
        reuseText:
          reusedBy.length > 0
            ? format(t(dict, "actions.reusedBy"), { programs: reusedBy.map((r) => r.name).join(", ") })
            : t(dict, "actions.notReused"),
      };
    }),
    order: edgesIn.map((e) => {
      const fromName = programName(dict, programFor(e.from), e.from);
      const reasonText = t(dict, e.reasonKey);
      return {
        from: e.from,
        fromName,
        reasonText,
        text: format(t(dict, "actions.doAfter"), { program: fromName, reason: reasonText }),
      };
    }),
  };
}

/** All cards in graph order. Each node is paired with its evaluation by `evaluationRef`. */
export function localizeActionCards(
  dict: Dictionary,
  locale: Locale,
  result: BridgeEvaluationResult,
  fixture: Fixture,
): ActionCardView[] {
  return result.graph.nodes.map((node) => {
    const evaluation = result.evaluations.find((e) => e.programId === node.evaluationRef);
    if (!evaluation) throw new Error(`localizeActionCards: no evaluation for ${node.id}`);
    return localizeActionCard(dict, locale, node, evaluation, result.graph, fixture);
  });
}

// ---------------------------------------------------------------------------
// Step 4: reusable evidence

export interface EvidenceRowView {
  evidenceTypeId: string;
  label: string;
  synthetic: boolean;
  syntheticLabel: string | null;
  uses: EvidenceUseView[];
  reused: boolean;
  reuseText: string | null;
}

/**
 * One row per EvidenceType, in the order the domain already deduplicated them
 * (BridgeEvaluationResult.evidence). The UI does not regroup or reorder.
 */
export function localizeEvidence(
  dict: Dictionary,
  evidence: BridgeEvaluationResult["evidence"],
  nodes: readonly ActionNode[],
): EvidenceRowView[] {
  const programFor = programOf(nodes);
  return evidence.map((row) => {
    const uses = row.uses.map((u) => {
      const programId = programFor(u.actionId);
      return {
        actionId: u.actionId,
        programId,
        name: programName(dict, programId, u.actionId),
        level: u.level,
        levelLabel: t(dict, `level.${u.level}`),
      };
    });
    return {
      evidenceTypeId: row.evidenceTypeId,
      label: t(dict, `evidence.${row.evidenceTypeId}`),
      synthetic: row.synthetic,
      syntheticLabel: row.synthetic ? t(dict, "labels.syntheticRule") : null,
      uses,
      reused: uses.length > 1,
      reuseText: uses.length > 1 ? format(t(dict, "documents.reused"), { count: uses.length }) : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Step 5: uncertainty and human help

export const HUMAN_HELP_OPTIONS: readonly HumanHelpOption[] = ["legal_aid", "program_office", "general_help_line"];

export function statementsOf(dict: Dictionary): string[] {
  return [t(dict, "statements.notEligibility"), t(dict, "statements.notAgency"), t(dict, "statements.noNtqAssessment")];
}

export interface HelpView {
  cantTell: { programId: ProgramId; name: string; missing: FactLabel[]; unconfirmed: FactLabel[] }[];
  noneCantTell: string | null;
  syntheticRules: { ruleId: string; ruleVersion: number; text: string }[];
  unreviewedSources: SourceView[];
  humanHelp: { option: HumanHelpOption; name: string }[];
  legalAidNotice: string | null;
  statements: string[];
}

export function localizeHelp(
  dict: Dictionary,
  locale: Locale,
  result: BridgeEvaluationResult,
  fixture: Fixture,
): HelpView {
  const cantTell = result.evaluations
    .filter((e) => e.status === "cant_tell")
    .map((e) => ({
      programId: e.programId,
      name: t(dict, `program.${e.programId}`),
      missing: e.missingFactIds.map((id) => factLabel(dict, id)),
      unconfirmed: e.unconfirmedFactIds.map((id) => factLabel(dict, id)),
    }));

  const ruleIds = result.graph.nodes.map((n) => n.ruleId);
  const syntheticRules = fixture.rules
    .filter((r) => r.synthetic && ruleIds.includes(r.id))
    .map((r) => ({
      ruleId: r.id,
      ruleVersion: r.version,
      text: format(t(dict, "help.syntheticRule"), { ruleId: r.id, ruleVersion: r.version }),
    }));

  const citedSourceIds = [...new Set(result.graph.nodes.flatMap((n) => n.sourceIds))];
  const unreviewedSources = citedSourceIds
    .map((id) => sourceView(dict, locale, fixture, id))
    .filter((s) => s.unverified);

  // Req 11.3 is a display condition on a confirmed fact, not a matching decision.
  const ntq = result.facts.find((f) => f.id === "received_notice_to_quit");
  const showLegalAid = ntq?.confirmation === "confirmed" && ntq.value === true;

  return {
    cantTell,
    noneCantTell: cantTell.length === 0 ? t(dict, "help.noneCantTell") : null,
    syntheticRules,
    unreviewedSources,
    humanHelp: HUMAN_HELP_OPTIONS.map((option) => ({ option, name: t(dict, `humanHelp.${option}`) })),
    legalAidNotice: showLegalAid ? t(dict, "help.legalAidNotice") : null,
    statements: statementsOf(dict),
  };
}

// ---------------------------------------------------------------------------
// Step 6: one language block of the printable handoff

export interface HandoffBlockView {
  lang: Locale;
  fictionalDemo: string;
  blockTitle: string;
  confirmedFacts: { factId: FactId; label: string; value: ResidentFact["value"]; valueLabel: string }[];
  unknownFacts: { factId: FactId; label: string; state: HandoffPacket["unknownFacts"][number]["state"]; stateLabel: string }[];
  actions: {
    id: ActionId;
    programId: ProgramId;
    name: string;
    status: MatchStatus;
    ruleId: string;
    ruleVersion: number | null;
    deadline: Deadline;
    deadlineText: string;
    ruleLine: string;
    dimensions: DimensionView[];
    synthetic: boolean;
    syntheticLabel: string | null;
  }[];
  evidence: EvidenceRowView[];
  targets: { actionId: ActionId; name: string; view: HandoffTargetView }[];
  fixtureVersion: number;
  fixtureVersionText: string;
  generatedAt: string;
  generatedAtText: string;
  statements: string[];
}

export function localizeHandoff(
  dict: Dictionary,
  locale: Locale,
  packet: HandoffPacket,
  fixture: Fixture,
): HandoffBlockView {
  const programFor = programOf(packet.actions);
  const versionOf = (ruleId: string) => packet.ruleVersions.find((r) => r.ruleId === ruleId)?.version ?? null;

  return {
    lang: locale,
    fictionalDemo: t(dict, "labels.fictionalDemo"),
    blockTitle: t(dict, "handoff.blockTitle"),
    confirmedFacts: packet.confirmedFacts.map((f) => ({
      factId: f.id,
      label: t(dict, `facts.${f.id}`),
      value: f.value,
      valueLabel: factValueLabel(dict, f),
    })),
    unknownFacts: packet.unknownFacts.map((u) => ({
      factId: u.factId,
      label: t(dict, `facts.${u.factId}`),
      state: u.state,
      stateLabel: t(dict, `handoff.factState.${u.state}`),
    })),
    actions: packet.actions.map((node) => {
      const ruleVersion = versionOf(node.ruleId);
      const synthetic = isSyntheticRule(fixture, node.ruleId);
      return {
        id: node.id,
        programId: node.programId,
        name: t(dict, `program.${node.programId}`),
        status: node.status,
        ruleId: node.ruleId,
        ruleVersion,
        deadline: node.deadline,
        deadlineText: deadlineText(dict, node.deadline),
        ruleLine: format(t(dict, "actions.ruleLine"), {
          ruleId: node.ruleId,
          ruleVersion: ruleVersion ?? "?",
          fixtureVersion: packet.fixtureVersion,
        }),
        dimensions: dimensionsOf(dict, node),
        synthetic,
        syntheticLabel: synthetic ? t(dict, "labels.syntheticRule") : null,
      };
    }),
    evidence: localizeEvidence(dict, packet.evidence, packet.actions),
    targets: packet.handoffTargets.map((h) => ({
      actionId: h.actionId,
      name: programName(dict, programFor(h.actionId), h.actionId),
      view: handoffTargetView(dict, h.target),
    })),
    fixtureVersion: packet.fixtureVersion,
    fixtureVersionText: format(t(dict, "handoff.fixtureVersion"), { version: packet.fixtureVersion }),
    generatedAt: packet.generatedAt,
    generatedAtText: format(t(dict, "handoff.generatedAt"), { date: packet.generatedAt }),
    statements: statementsOf(dict),
  };
}

/** Explanation template text for the deterministic fallback (`explain.<programId>.<status>`). */
export function explanationTemplate(dict: Dictionary, programId: ProgramId, status: MatchStatus): string {
  return t(dict, `explain.${programId}.${status}`);
}
