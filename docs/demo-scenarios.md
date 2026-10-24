# Demo scenarios

Fictional data only. Nothing is submitted to any agency. Owner: Teammate 2 (verification).

## Scenario A: demo persona, every fact confirmed

Source: design "Expected demo outcome" (`.kiro/specs/action-graph/design.md`).

Facts: `preferred_language=es`, `city=Boston`, `neighborhood=unknown`, `household_size=2`, `single_parent=true`, `lives_in_ma=true`, `lost_job_recently=true`, `rents_home=true`, `received_notice_to_quit=true`, `has_utility_account=true`, `received_shutoff_notice=unknown`. All confirmed.

| Step | Expected | Actual (2026-10-24, `feature/action-plan-handoff`, stub adapter) | Evidence |
|---|---|---|---|
| 3 Actions | 3 cards in order A-RAFT, A-SNAP, A-UTIL; status may_match / may_match / cant_tell; urgency urgent / standard / unknown; all `unknown(source_unreviewed)` deadlines; UTIL lists `received_shutoff_notice` under Missing; edges RAFT→SNAP, RAFT→UTIL; "Demo rule" label; no external links | Matches, in `en` and `es` | `tests/e2e/action-plan.spec.ts`, `tests/e2e/locale-switch.spec.ts` |
| 4 Documents | E-ID listed once with 3 actions; no upload control | Matches | `tests/e2e/action-plan.spec.ts` |
| 5 Help | Utility "can't tell yet"; legal-aid notice; 3 statements; 3 help options by name | Matches | `tests/e2e/action-plan.spec.ts` |
| 6 Handoff | Two blocks (`lang="en"`, `lang="es"`); unknown fact shown as unknown; one print button; print hides chrome, no clipping | Matches | `tests/e2e/action-plan.spec.ts`, `tests/e2e/print.spec.ts` |
| Language switch | Same step, no reload, same IDs/statuses/dimensions/deadlines/edges/dates | Matches on `/actions` and `/handoff` | `tests/e2e/locale-switch.spec.ts` |
| 1–2 Intake, confirm | Demo fill, confirm all | Not built on this branch (Teammate 1) | `tests/e2e/journey.spec.ts` skipped while `PRE_INTEGRATION = true` |

Pre-integration limits: steps 3–6 read a hand-written stub (`src/components/steps/stubJourney.ts`), not the engine, so these rows check presentation only. Fact labels and fact values (`facts.*`, `factOptions.*`, `value.*`) show raw keys until Teammate 1's dictionary keys merge. Re-run every row on the integrated build.

## Automated accessibility record (Req 15.6)

axe (`@axe-core/playwright` 4.14.0, tags wcag2a/2aa/21a/21aa/22aa), 2026-10-24, local production build, desktop and Pixel 7 Chromium, plus a 320 px pass:

| Step | en violations | es violations |
|---|---|---|
| actions | 0 | 0 |
| documents | 0 | 0 |
| help | 0 | 0 |
| handoff | 0 | 0 |
| story (placeholder) | 0 | 0 (from `landing.spec.ts`) |
| confirm | not run (not built) | not run |

Automated checks are not full validation. No manual screen-reader testing or expert review has been done. No WCAG conformance is claimed.
