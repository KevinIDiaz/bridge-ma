import type { Explanation } from "@/lib/rules/types";
import type { ExplainInput, ModelAdapter } from "./adapter";
import { explainTemplate } from "./templates";

export const EXPLANATION_MAX_CHARS = 600;
export const EXPLANATION_TIMEOUT_MS = 5000;

const TIMED_OUT = Symbol("timed_out");

/**
 * Asks the adapter for an explanation of an already-decided status.
 * Falls back to the rule-based template on a throw, a timeout, or empty text.
 * The adapter receives only { programId, status, locale }. Output never feeds matching.
 */
export async function explainWithFallback(
  adapter: ModelAdapter,
  input: ExplainInput,
  timeoutMs: number = EXPLANATION_TIMEOUT_MS,
  template: string = explainTemplate(input),
): Promise<Explanation> {
  const fallback: Explanation = { text: template.slice(0, EXPLANATION_MAX_CHARS), origin: "rule_based" };
  const payload: ExplainInput = { programId: input.programId, status: input.status, locale: input.locale };

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), timeoutMs);
  });

  try {
    const result = await Promise.race([adapter.explain(payload), timeout]);
    if (result === TIMED_OUT || typeof result?.text !== "string" || result.text.trim() === "") return fallback;
    return {
      text: result.text.slice(0, EXPLANATION_MAX_CHARS),
      origin: adapter.deterministic ? "rule_based" : "generated",
    };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
