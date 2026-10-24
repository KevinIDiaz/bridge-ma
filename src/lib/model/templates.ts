import { getDictionary } from "@/lib/i18n";
import type { ExplainInput } from "./adapter";

/**
 * Rule-based explanation template `explain.<programId>.<status>` for the locale.
 * Returns "" when the key is not in the dictionary yet, so the UI can hide the region
 * instead of showing a hard-coded string. Keys are added in src/lib/i18n (task 2.19).
 */
export function explainTemplate(input: ExplainInput, dict: unknown = getDictionary(input.locale)): string {
  let node: unknown = dict;
  for (const key of ["explain", input.programId, input.status]) {
    if (typeof node !== "object" || node === null || !Object.hasOwn(node, key)) return "";
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === "string" ? node : "";
}
