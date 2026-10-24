import { INTAKE_FACT_DEFS } from "@/lib/session/factDefs";
import type { FactDef, FactValue, Unknown } from "@/lib/rules/types";
import type { AssistantRequest, AssistantTurn, FactConfidence, ProposedFact } from "./types";

export const ASSISTANT_MESSAGE_MAX = 2_000;
export const ASSISTANT_REPLY_MAX = 700;
export const ASSISTANT_QUESTION_MAX = 300;

const defsById = new Map(INTAKE_FACT_DEFS.map((def) => [def.id, def]));
const confidences = new Set<FactConfidence>(["high", "medium", "low"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseFactValue(def: FactDef, value: unknown): FactValue | Unknown | null {
  if (value === "unknown") return "unknown";

  if (def.kind === "boolean") {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return null;
  }

  if (def.kind === "number") {
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(number)) return null;
    if (def.min !== undefined && number < def.min) return null;
    if (def.max !== undefined && number > def.max) return null;
    return number;
  }

  if (typeof value !== "string") return null;
  const normalized = value.normalize("NFC").replace(/\s+/g, " ").trim().slice(0, 200);
  if (!normalized) return null;
  if (def.kind === "choice" && !def.options?.includes(normalized)) return null;
  return normalized;
}

export function validateProposedFacts(input: unknown): ProposedFact[] {
  if (!Array.isArray(input)) return [];
  const byId = new Map<string, ProposedFact>();

  for (const item of input) {
    if (!isRecord(item) || typeof item.id !== "string") continue;
    const def = defsById.get(item.id);
    if (!def) continue;
    const value = parseFactValue(def, item.value);
    if (value === null) continue;
    const confidence = confidences.has(item.confidence as FactConfidence)
      ? (item.confidence as FactConfidence)
      : "medium";
    byId.set(item.id, { id: item.id, value, confidence });
  }

  return [...byId.values()];
}

export function validateAssistantRequest(input: unknown): AssistantRequest | null {
  if (!isRecord(input) || (input.locale !== "en" && input.locale !== "es") || typeof input.message !== "string") {
    return null;
  }
  const message = input.message.normalize("NFC").replace(/\0/g, "").trim().slice(0, ASSISTANT_MESSAGE_MAX);
  if (!message) return null;
  return {
    message,
    locale: input.locale,
    currentFacts: validateProposedFacts(input.currentFacts),
  };
}

export function validateAssistantTurn(input: unknown, mode: AssistantTurn["mode"]): AssistantTurn | null {
  if (!isRecord(input) || typeof input.reply !== "string" || typeof input.followUpQuestion !== "string") return null;
  if (typeof input.readyForReview !== "boolean") return null;
  const reply = input.reply.normalize("NFC").replace(/\s+/g, " ").trim().slice(0, ASSISTANT_REPLY_MAX);
  const followUpQuestion = input.followUpQuestion
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, ASSISTANT_QUESTION_MAX);
  if (!reply) return null;
  return {
    reply,
    proposedFacts: validateProposedFacts(input.proposedFacts),
    followUpQuestion,
    readyForReview: input.readyForReview,
    mode,
  };
}

export function mergeProposedFacts(current: readonly ProposedFact[], incoming: readonly ProposedFact[]): ProposedFact[] {
  const byId = new Map(current.map((fact) => [fact.id, fact]));
  for (const fact of incoming) byId.set(fact.id, fact);
  return INTAKE_FACT_DEFS.flatMap((def) => {
    const fact = byId.get(def.id);
    return fact ? [fact] : [];
  });
}

