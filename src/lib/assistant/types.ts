import type { Locale } from "@/lib/i18n";
import type { FactValue, Unknown } from "@/lib/rules/types";

export type AssistantMode = "live" | "demo";
export type FactConfidence = "high" | "medium" | "low";

export interface ProposedFact {
  id: string;
  value: FactValue | Unknown;
  confidence: FactConfidence;
}

export interface AssistantTurn {
  reply: string;
  proposedFacts: ProposedFact[];
  followUpQuestion: string;
  readyForReview: boolean;
  mode: AssistantMode;
}

export interface AssistantRequest {
  message: string;
  locale: Locale;
  currentFacts: ProposedFact[];
}

