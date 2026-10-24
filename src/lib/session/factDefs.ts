// Feature-local FactDef stub for the intake flow (Teammate 1).
//
// WHY THIS EXISTS: IntakeStep and ConfirmStep need the ordered list of FactDefs
// to render one control per fact. The authoritative list lives in the Lead's
// `src/fixtures/programs.v2.json` (task 1.2), which has not merged onto this
// branch yet. Per the team rule ("build against a small feature-local stub that
// documents its assumptions; never redefine shared types"), this mirrors the
// design's "Fixture src/fixtures/programs.v2.json" facts table exactly.
//
// AT INTEGRATION: the Lead/integrator should delete this file and feed the
// intake components `fixtureResult.value.facts` instead. The shape here is the
// shared `FactDef` type from the contract — it is not redefined.
//
// Assumptions encoded (from design "Facts" + "Expected demo outcome"):
// - Order matches the design table; the first text/number fact pairs with an
//   "I don't know" control; booleans/choices use a radio group incl. "I don't know".
// - `neighborhood` is areaContext (never reaches the engine) but is still shown
//   in intake/confirm as area context.
// - Demo fill values come from design "Expected demo outcome".

import type { FactDef, FactValue, Unknown } from "@/lib/rules/types";

export const INTAKE_FACT_DEFS: readonly FactDef[] = [
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
];

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
