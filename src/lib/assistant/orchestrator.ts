import { fallbackAssistantTurn } from "./fallback";
import { openAIAssistantTurn } from "./openai";
import type { AssistantRequest, AssistantTurn } from "./types";

export async function runAssistant(request: AssistantRequest): Promise<AssistantTurn> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return fallbackAssistantTurn(request);
  try {
    return await openAIAssistantTurn(request, apiKey);
  } catch {
    return fallbackAssistantTurn(request);
  }
}

