import type { Locale } from "@/lib/i18n";
import type { ProgramId } from "@/lib/data/programs";
import type { MatchStatus } from "@/lib/rules/types";

/** Anything a model produces is labeled as generated. It never feeds back into matching. */
export interface GeneratedText {
  readonly kind: "generated";
  readonly provider: string;
  readonly text: string;
}

export interface ExplainInput {
  programId: ProgramId;
  /** Status already decided by deterministic rules; the model only explains it. */
  status: MatchStatus;
  locale: Locale;
}

/** Provider-independent interface. Adapters may normalize or explain; they cannot decide outcomes. */
export interface ModelAdapter {
  readonly id: string;
  normalize(input: string, locale: Locale): Promise<GeneratedText>;
  explain(input: ExplainInput): Promise<GeneratedText>;
}

/** Deterministic fallback used for the demo. No network, no API key. */
export const demoAdapter: ModelAdapter = {
  id: "demo-fallback",
  async normalize(input) {
    return { kind: "generated", provider: this.id, text: input.normalize("NFC").replace(/\s+/g, " ").trim() };
  },
  async explain({ programId, status }) {
    // Placeholder until explanation templates exist. Not shown to users yet.
    return { kind: "generated", provider: this.id, text: `[demo] ${programId}: ${status}` };
  },
};

/** No production provider is configured; the demo adapter is always used. */
export function getModelAdapter(): ModelAdapter {
  return demoAdapter;
}
