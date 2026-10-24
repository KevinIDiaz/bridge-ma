// Intake fact definitions and the fictional demo fill (Teammate 1; wired at integration).
//
// Integration (Stage 3): the stub list was replaced by the fixture's FactDefs, so intake,
// confirmation, and the engine read one source of truth (`src/fixtures/programs.v2.json`).
// If the fixture fails to load, intake renders no controls and steps 3–6 show human help.
//
// - `neighborhood` is areaContext (never reaches the engine) but is still shown
//   in intake/confirm as area context.
// - Demo fill values come from design "Expected demo outcome". Fictional data only.

import { fixtureResult } from "@/lib/data/programs";
import type { FactDef, FactValue, Unknown } from "@/lib/rules/types";

export const INTAKE_FACT_DEFS: readonly FactDef[] = fixtureResult.ok ? fixtureResult.value.facts : [];

/** Demo persona (design "Expected demo outcome"). Fictional data only. */
export const DEMO_FILL: Readonly<Record<string, FactValue | Unknown>> = {
  preferred_language: "es",
  city: "Boston",
  neighborhood: "unknown",
  household_size: 2,
  single_parent: true,
  lives_in_ma: true,
  lost_job_recently: true,
  rents_home: true,
  received_notice_to_quit: true,
  has_utility_account: true,
  received_shutoff_notice: "unknown",
};
