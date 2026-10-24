# Implementation Plan: Action Graph

## Overview

This plan builds a working vertical slice of the six-step Bridge MA journey today, in TypeScript (Next.js App Router, Vitest, fast-check 4.10.2, Playwright). The pure domain modules come first and are covered by property tests. The UI steps follow in journey order, then locale switching, then the printable handoff, then browser verification. Every task is required. None is optional.

## Tasks

- [x] 1. Domain types and fixture schemas
  - [x] 1.1 Replace `src/lib/rules/types.ts` with the domain types from design "Data Models"
    - Add `ResidentFact`, `FactDef`, `Source`, `Predicate`, `DeadlineCalc`, `RuleVersion`, `ActionDef`, `EvidenceType`, `EvidenceRequirementDef`, `EdgeDef`, `Fixture`, `EngineFacts`, `ProgramEvaluation`, the five dimension types, `Deadline`, `HandoffTarget`, `EvidenceRequirement`, `ActionNode`, `ActionEdge`, `ActionGraph`, `HandoffPacket`, `Explanation`, `Result`, `BridgeEvaluationResult`, `ReusableEvidence`, `BridgeError`, and the error unions
    - This file is the shared team contract; changes need coordination.
    - Remove the old `Fact` / `confirmed: boolean` types and update any importers
    - _Requirements: 1.3, 3.3, 3.8, 5.1, 6.1, 9.1, 13.1_
    - Done when: `npm run typecheck` passes.
  - [x] 1.2 Create `src/fixtures/programs.v2.json` and delete `src/fixtures/programs.v1.json`
    - Use `version: 2` and copy the three v1 Sources unchanged (all `unreviewed`, URL `null`)
    - Add the facts, rules (`R-SNAP`, `R-RAFT`, `R-UTIL`, all `synthetic: true`, `deadline: null`), actions, evidence types, evidence requirements, and the two `edge.housing_first` edges, exactly as in the design tables
    - Include no dollar amounts, day counts, income limits, or date ranges
    - _Requirements: 3.1, 4.2, 4.7, 7.11, 9.3, 10.1_
    - Done when: the file parses as JSON and `src/fixtures/programs.v1.json` no longer exists.
  - [x] 1.3 Implement `parseFixture` and `fixtureResult` in `src/lib/data/programs.ts`
    - Run every check listed under design "Fixture loader": facts, rules (unknown source names the rule ID and source ID; `synthetic: false` with a non-`reviewed` source lists each such source ID), actions, evidence types and requirements (undefined IDs, repeated pairs), edges, and the no-numbers guard regex
    - Collect all errors and return `ok: false` with no partial data
    - _Requirements: 4.1, 4.2, 4.7, 10.3_
    - Done when: `npm run typecheck` passes and `fixtureResult.ok === true` for the v2 fixture.
  - [x] 1.4 Replace `tests/unit/program-fixture.test.ts` with `tests/unit/fixture.test.ts`
    - v2 parses ok
    - One failing example per rejection rule: unknown source, `synthetic: false` with an unreviewed source, undefined evidence type, undefined action, duplicate (type, action) pair, bad edge
    - The no-numbers guard rejects a `$`, day-count, or `YYYY-MM-DD` string on an unreviewed record, and passes on the real v2 fixture
    - _Requirements: 4.1, 4.2, 4.7, 10.3_
    - Done when: `npx vitest --run tests/unit/fixture.test.ts` passes and no test still imports `programs.v1.json`.
  - [x] 1.5 Create shared generators in `tests/property/arbitraries.ts`
    - `arbFactSet` and `arbSourceStatuses` as described in design "Correctness Properties", plus `arbFixture` (valid schema fixtures) and `arbGraph` helpers for the validator properties
    - Use fictional data only
    - _Requirements: 16.13_
    - Done when: `npm run typecheck` passes.
  - [x] 1.6 Write property test for the fixture round trip in `tests/property/fixture.property.test.ts`
    - **Property 18: Fixture round trip**
    - **Validates: Requirements 16.12, 16.13**
    - Done when: `npx vitest --run tests/property/fixture.property.test.ts` passes with `numRuns: 100`.

- [ ] 2. Deterministic evaluation and property tests
  - [x] 2.1 Implement `splitFacts` in `src/lib/rules/facts.ts` and `evaluatePrograms` in `src/lib/rules/engine.ts`
    - `splitFacts` drops `areaContext` facts and returns confirmed values plus unconfirmed IDs only
    - `evaluatePrograms` uses Kleene AND, fixed order `snap`, `raft`, `utility`, the missing/unconfirmed/neither partition, and `rule_count` errors
    - Add `tests/unit/engine.test.ts`: demo persona before confirmation (all `cant_tell`) and after confirmation (RAFT and SNAP `may_match`, utility `cant_tell` missing `received_shutoff_notice`); `rule_count` errors for 0 rules, 2 rules, and zero predicates
    - _Requirements: 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12_
    - Done when: `npx vitest --run tests/unit/engine.test.ts` passes and `npm run lint` reports no boundary violation.
  - [x] 2.2 Write property test for status in `tests/property/engine.property.test.ts`
    - **Property 2: Status equals the Kleene reference, and unknown is never definitive**
    - **Validates: Requirements 3.3, 3.4, 3.5, 3.6, 16.2, 16.13**
    - Done when: `npx vitest --run tests/property/engine.property.test.ts` passes with `numRuns: 100`.
  - [x] 2.3 Write property test for the fact partition in `tests/property/engine.property.test.ts`
    - **Property 3: Required facts are partitioned**
    - **Validates: Requirements 2.6, 3.7, 16.13**
    - Done when: `npx vitest --run tests/property/engine.property.test.ts` passes with `numRuns: 100` per property.
  - [x] 2.4 Implement `computeDeadline` in `src/lib/rules/deadline.ts`
    - Precedence `source_unreviewed` > `unsupported` > `facts_unconfirmed`; computed path uses UTC date plus `offsetDays`; no clock read
    - Add `tests/unit/deadline.test.ts`: one example per reason, and one computed date using a test-only reviewed fixture
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.9_
    - Done when: `npx vitest --run tests/unit/deadline.test.ts` passes.
  - [x] 2.5 Write property test for deadlines in `tests/property/deadline.property.test.ts`
    - **Property 17: No deadline without a reviewed source**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.9, 16.11, 16.13**
    - Done when: `npx vitest --run tests/property/deadline.property.test.ts` passes with `numRuns: 100`.
  - [x] 2.6 Implement `validateGraph` in `src/lib/rules/validate.ts`
    - Duplicates, dangling edges (`absent: from | to | both`), self-loops, and iterative DFS cycles, all collected in one result
    - Add `tests/unit/validate.test.ts`: one hand-made graph with all three error kinds, and a valid zero-edge graph returning `[]`
    - _Requirements: 5.6, 5.7, 5.8, 5.9, 5.10, 5.11_
    - Done when: `npx vitest --run tests/unit/validate.test.ts` passes.
  - [x] 2.7 Write property test for duplicate IDs in `tests/property/validate.property.test.ts`
    - **Property 11: Validator reports every duplicate ID**
    - **Validates: Requirements 5.6, 5.10, 16.7, 16.13**
    - Done when: `npx vitest --run tests/property/validate.property.test.ts` passes with `numRuns: 100`.
  - [x] 2.8 Write property test for dangling edges in `tests/property/validate.property.test.ts`
    - **Property 12: Validator reports every dangling edge**
    - **Validates: Requirements 5.7, 5.10, 16.8, 16.13**
    - Done when: `npx vitest --run tests/property/validate.property.test.ts` passes with `numRuns: 100` per property.
  - [x] 2.9 Write property test for cycle detection in `tests/property/validate.property.test.ts`
    - **Property 13: Cycle detection matches a reference** (Kahn's algorithm oracle)
    - **Validates: Requirements 5.8, 5.9, 5.11, 16.9, 16.13**
    - Done when: `npx vitest --run tests/property/validate.property.test.ts` passes with `numRuns: 100` per property.
  - [x] 2.10 Implement `buildGraph` in `src/lib/rules/graph.ts`
    - References with `missing_ref` errors; status copy; urgency, sourceFreshness, factConfirmation, explanationOrigin (default `rule_based`); deadline via `computeDeadline`; handoff selection; evidence with `reusedBy`; urgency-then-`raft`/`utility`/`snap` order; forward-only edges
    - Add `tests/unit/graph.test.ts`: `missing_ref` for each ref kind; demo outcome table after full confirmation (order RAFT, SNAP, UTIL, both edges kept); edges dropped before confirmation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.6, 6.7, 7.8, 7.9, 7.11_
    - Done when: `npx vitest --run tests/unit/graph.test.ts` passes and `npm run lint` reports no boundary violation.
  - [x] 2.11 Write property test for determinism in `tests/property/graph.property.test.ts`
    - **Property 1: Pipeline determinism**
    - **Validates: Requirements 3.11, 9.6, 16.1, 16.13**
    - Done when: `npx vitest --run tests/property/graph.property.test.ts` passes with `numRuns: 100`.
  - [x] 2.12 Write property test for unconfirmed values in `tests/property/graph.property.test.ts`
    - **Property 4: Unconfirmed values never change matching**
    - **Validates: Requirements 2.5, 3.2, 16.3, 16.13**
    - Done when: `npx vitest --run tests/property/graph.property.test.ts` passes with `numRuns: 100` per property.
  - [x] 2.13 Write property test for neighborhood isolation in `tests/property/graph.property.test.ts`
    - **Property 5: Neighborhood never changes matching**
    - **Validates: Requirements 3.9, 16.4, 16.13**
    - Done when: `npx vitest --run tests/property/graph.property.test.ts` passes with `numRuns: 100` per property.
  - [x] 2.14 Write property test for graph invariants in `tests/property/graph.property.test.ts`
    - **Property 6: Graph structural invariants and reference integrity**
    - **Validates: Requirements 3.1, 3.8, 5.1, 5.2, 5.3, 5.5, 5.11, 16.6, 16.13**
    - Done when: `npx vitest --run tests/property/graph.property.test.ts` passes with `numRuns: 100` per property.
  - [x] 2.15 Write property test for dimension derivation in `tests/property/graph.property.test.ts`
    - **Property 7: Dimension derivation**
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.6, 6.7, 16.13**
    - Done when: `npx vitest --run tests/property/graph.property.test.ts` passes with `numRuns: 100` per property.
  - [x] 2.16 Write property test for dimension independence in `tests/property/graph.property.test.ts`
    - **Property 8: Dimensions are independent**
    - **Validates: Requirements 6.1, 16.13**
    - Done when: `npx vitest --run tests/property/graph.property.test.ts` passes with `numRuns: 100` per property.
  - [x] 2.17 Write property test for handoff selection in `tests/property/graph.property.test.ts`
    - **Property 9: Handoff target selection**
    - **Validates: Requirements 4.6, 7.8, 7.9, 7.10, 16.13**
    - Done when: `npx vitest --run tests/property/graph.property.test.ts` passes with `numRuns: 100` per property.
  - [x] 2.18 Implement `buildHandoffPacket` in `src/lib/rules/handoff.ts`
    - Takes `today` as a parameter; `unknownFacts` lists missing, `unknown`, and unconfirmed required facts with their state; leaves out `neighborhood`; no Model_Adapter import
    - Add `tests/unit/handoff.test.ts`: demo persona packet after confirmation (utility's `received_shutoff_notice` listed as `unknown`, never `false`; `generatedAt` equals the passed date)
    - _Requirements: 13.1, 13.3_
    - Done when: `npx vitest --run tests/unit/handoff.test.ts` passes.
  - [ ] 2.19 Add dictionary keys and implement the Localizer
    - Add every key group from design "Dictionary additions" to `src/lib/i18n/en.json` and `src/lib/i18n/es.json`, with the same key set and non-empty values, including the field-specific validation errors and all UI strings for steps 1–6
    - Implement `localizeActionCard`, `localizeEvidence`, `localizeHelp`, and `localizeHandoff` in `src/lib/i18n/localize.ts` (React-free; structured fields passed through unchanged; source entries carry `lang="en"` when the active locale is `es`)
    - Add `tests/unit/localize.test.ts`: three distinct TriState labels; dictionary scan finds no `eligible|qualif|approved|guarantee|elegible|califica|aprobad|garantiz` and no Notice to Quit validity wording; `localizeHelp` with and without a `cant_tell` program
    - _Requirements: 2.4, 7.2, 7.7, 10.1, 10.2, 11.1, 11.2, 11.5, 11.8, 12.1, 12.2, 12.3, 15.9_
    - Done when: `npx vitest --run tests/unit/localize.test.ts tests/unit/i18n.test.ts` passes.
  - [ ] 2.20 Write property test for evidence reuse in `tests/property/localize.property.test.ts`
    - **Property 10: Evidence reuse is consistent**
    - **Validates: Requirements 7.11, 10.1, 10.2, 16.13**
    - Done when: `npx vitest --run tests/property/localize.property.test.ts` passes with `numRuns: 100`.
  - [ ] 2.21 Write property test for locale structure in `tests/property/localize.property.test.ts`
    - **Property 16: Locale never changes structure**
    - **Validates: Requirements 12.3, 13.2, 16.10, 16.13**
    - Done when: `npx vitest --run tests/property/localize.property.test.ts` passes with `numRuns: 100` per property.
  - [ ] 2.22 Add the `deterministic` flag to `src/lib/model/adapter.ts` and implement `explainWithFallback` in `src/lib/model/explain.ts`
    - The demo adapter's `explain` returns the `explain.<programId>.<status>` template for the locale; `normalize` stays local (trim and NFC)
    - `explainWithFallback` uses a 5 s timeout, falls back on throw, timeout, or empty/whitespace text, assigns origin from `deterministic`, and cuts text to 600 characters
    - Add `tests/unit/explain.test.ts`: the fallback is deterministic per (program, status, locale) and a `fetch` spy records zero calls
    - _Requirements: 8.2, 8.4, 8.6, 8.7, 14.1, 14.3, 14.8_
    - Done when: `npx vitest --run tests/unit/explain.test.ts tests/property/model-adapter.property.test.ts` passes.
  - [ ] 2.23 Write property test for model isolation in `tests/property/explain.property.test.ts`
    - **Property 14: Model output never changes matching** (uses `vi.useFakeTimers()` for the timeout path)
    - **Validates: Requirements 6.8, 8.2, 8.4, 8.5, 14.6, 14.7, 16.5, 16.13**
    - Done when: `npx vitest --run tests/property/explain.property.test.ts` passes with `numRuns: 100`.
  - [ ] 2.24 Write property test for the explanation cap in `tests/property/explain.property.test.ts`
    - **Property 15: Explanation text is capped**
    - **Validates: Requirements 8.6, 16.13**
    - Done when: `npx vitest --run tests/property/explain.property.test.ts` passes with `numRuns: 100` per property.

  - [x] 2.25 Implement `evaluateBridge` in `src/lib/rules/bridge.ts`
    - Pure pipeline: `splitFacts` → `evaluatePrograms` → `buildGraph` → `validateGraph` → evidence dedupe → `buildHandoffPacket`; returns the first failing stage's errors and no partial result
    - Returns `Result<BridgeEvaluationResult, BridgeError>`; no `@/lib/model` import
    - Add `tests/unit/bridge.test.ts`: demo persona with all facts confirmed (order RAFT, SNAP, UTIL; `E-ID` reused by three actions; handoff `generatedAt` equals the passed date), one failing case per `BridgeError` kind, and a deep-freeze test proving inputs and output are not mutated
    - _Requirements: 3.10, 3.11, 5.12, 8.5, 10.1, 13.1_
    - Done when: `npx vitest --run tests/unit/bridge.test.ts` passes and `npm run lint` reports no boundary violation.

  - [ ] 2.26 Checkpoint: domain layer
    - Ensure all tests pass, ask the user if questions arise.
    - _Requirements: 3.10, 16.13_
    - Done when: `npx vitest --run`, `npm run typecheck`, and `npm run lint` all pass.

- [ ] 3. Intake and fact confirmation
  - [ ] 3.1 Implement the session store and `useSession` hook
    - `src/lib/session/store.ts` with `get`, `subscribe`, `setFacts`, `confirmFact`, `updateFact` (resets to `unconfirmed` and clears cached explanations), `setExplanation`, and `EMPTY_SESSION`; no React import; no cookies or storage
    - `src/components/useSession.ts` using `useSyncExternalStore` with `EMPTY_SESSION` as the server snapshot
    - Add `tests/unit/store.test.ts`: `confirmFact` changes only one fact and keeps its value (including `unknown`); `updateFact` resets to `unconfirmed`, including on a change to `unknown`; server snapshot is empty
    - _Requirements: 1.6, 2.2, 2.3, 14.2_
    - Done when: `npx vitest --run tests/unit/store.test.ts` passes.
  - [ ] 3.2 Implement input validation in `src/lib/session/validation.ts`
    - Pure, React-free: text ≤ 200 characters, whole-number check, `household_size` 1–20, blank or "I don't know" → `"unknown"`, returns field-keyed error codes that map to dictionary `errors.*` keys
    - Add `tests/unit/validation.test.ts`: boundaries at 200/201 chars, `2.5`, `0`/`1`/`20`/`21`, blank → `unknown`
    - _Requirements: 1.7, 1.8, 2.7, 15.7_
    - Done when: `npx vitest --run tests/unit/validation.test.ts` passes.
  - [ ] 3.3 Implement `StepHeading` and `RequireSession`
    - `src/components/StepHeading.tsx`: the one `<h1 tabIndex={-1}>` per step, focused on mount
    - `src/components/RequireSession.tsx`: when `facts === null`, renders only the heading, the dictionary message, and a link to `/[lang]/story`
    - _Requirements: 12.7, 15.3, 15.8_
    - Done when: `npm run typecheck` and `npm run lint` pass.
  - [ ] 3.4 Implement `IntakeStep` and wire `src/app/[lang]/story/page.tsx`
    - `src/components/steps/IntakeStep.tsx`: one control per FactDef (fieldset and legend groups, separate "I don't know" choice), fictional-data notice above the first input, "Use fictional demo story" fill without submitting (values from design "Expected demo outcome"), no upload/camera/mic controls
    - On submit: validate with 3.2; on error show `aria-describedby` text errors, focus the first invalid input, keep values; on success `demoAdapter.normalize` text inputs, `session.setFacts` all `unconfirmed`, navigate to `/[lang]/confirm`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8, 14.8, 15.3, 15.7_
    - Done when: `npm run typecheck`, `npm run lint`, and `npm run build` pass.
  - [ ] 3.5 Implement `ConfirmStep` and create `src/app/[lang]/confirm/page.tsx`
    - `src/components/steps/ConfirmStep.tsx` inside `RequireSession`: one row per fact with label, value label (`value.true`/`value.false`/`value.unknown`), confirmation state, Confirm button, Edit form using the 3.2 validation; unconfirmed-count notice; neighborhood area-context note; link to `/[lang]/actions`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 2.8, 2.9, 12.7_
    - Done when: `npm run typecheck`, `npm run lint`, and `npm run build` pass.

- [ ] 4. Action cards and evidence reuse
  - [ ] 4.1 Implement `useJourney` in `src/components/useJourney.ts`
    - Thin memoized wrapper around `evaluateBridge` (passing `fixtureResult`, session facts, and origins from stored explanations); returns `Result<BridgeEvaluationResult, BridgeError>`
    - _Requirements: 4.3, 5.12, 8.3, 8.5_
    - Done when: `npm run typecheck` passes.
  - [ ] 4.2 Implement `ActionCard` and `ActionsStep`, and create `src/app/[lang]/actions/page.tsx`
    - `src/components/ActionCard.tsx` from `localizeActionCard`: "Rule-based result" region (rule ID, rule version, fixture version, status, deadline text), separate explanation region with its origin label, five dimensions as `<dl>` text pairs, Missing and Not yet confirmed lists (or the none-missing statement), sources with freshness and "Unverified" labels, "Demo rule" label, evidence rows with reuse, one next step, one handoff (portal link only for a reviewed Source; otherwise human help by name)
    - `src/components/steps/ActionsStep.tsx` inside `RequireSession`: three cards in graph order; any journey error → human-help message only; on `ok`, an effect calls `explainWithFallback` per node and stores results via `session.setExplanation`; explanation text rendered as a plain text child; link to `/[lang]/documents`
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 5.12, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 8.1, 8.3, 8.4, 8.6, 9.7, 9.8, 15.4_
    - Done when: `npm run typecheck`, `npm run lint`, and `npm run build` pass.
  - [ ] 4.3 Implement `DocumentsStep` and create `src/app/[lang]/documents/page.tsx`
    - `src/components/steps/DocumentsStep.tsx` inside `RequireSession`, from `localizeEvidence`: each EvidenceType once, its actions with `required`/`helpful` labels, "Demo rule" label, empty-state human-help message, no upload/capture control, same journey-error guard; link to `/[lang]/help`
    - _Requirements: 10.1, 10.2, 10.4, 10.5, 10.6, 5.12_
    - Done when: `npm run typecheck`, `npm run lint`, and `npm run build` pass.
  - [ ] 4.4 Implement `HelpStep` and create `src/app/[lang]/help/page.tsx`
    - `src/components/steps/HelpStep.tsx` inside `RequireSession`, from `localizeHelp`: `cant_tell` programs with missing and unconfirmed facts under separate labels (or the none message), synthetic rule IDs and versions, unreviewed sources, human help options by name only, legal-aid notice when `received_notice_to_quit` is confirmed `true`, and the three fixed statements; link to `/[lang]/handoff`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_
    - Done when: `npm run typecheck`, `npm run lint`, and `npm run build` pass.

- [ ] 5. Locale switching
  - [ ] 5.1 Add the static root layout and nest the `[lang]` layout
    - Create `src/app/layout.tsx` with `<html lang="en" suppressHydrationWarning>`, the inline lang script in `<head>`, `<body>`, and the `globals.css` import
    - Change `src/app/[lang]/layout.tsx` to a nested layout keeping `generateStaticParams`, `dynamicParams = false`, `generateMetadata`, `notFound()`, skip link, and footer, and rendering `<HtmlLangSync lang={lang} />`
    - Create `src/components/HtmlLangSync.tsx` that sets `document.documentElement.lang` in an effect
    - _Requirements: 12.4, 12.6, 15.9_
    - Done when: `npm run build` passes and `npx playwright test tests/e2e/landing.spec.ts` passes.
  - [ ] 5.2 Change `src/components/SiteHeader.tsx` to a client component with `next/link` language links
    - Link to `/${other}${path}` with `hrefLang` and `lang`, where `path` comes from `usePathname()` with the locale prefix stripped
    - _Requirements: 12.4, 12.5_
    - Done when: `npm run typecheck`, `npm run lint`, and `npm run build` pass.

- [ ] 6. Printable handoff
  - [ ] 6.1 Implement `HandoffStep` and create `src/app/[lang]/handoff/page.tsx`
    - `src/components/steps/HandoffStep.tsx` inside `RequireSession`: build the packet with `buildHandoffPacket` and today's local `YYYY-MM-DD`; render `<section lang="en" class="handoff-block">` and `<section lang="es" class="handoff-block">` from `localizeHandoff`, each with "Fictional demo", confirmed facts, unknown facts, three actions with dimensions, rule ID and version, deadline text, evidence, handoff targets, fixture version, generated-at date, "Demo rule" labels, and the three statements
    - One `<button class="print-control">` calling `window.print()`; no submit/send/share control; on journey error show the human-help message with a link to `/[lang]/confirm`
    - _Requirements: 9.7, 9.8, 11.4, 11.6, 13.1, 13.2, 13.3, 13.4, 13.6, 13.7, 13.8_
    - Done when: `npm run typecheck`, `npm run lint`, and `npm run build` pass.
  - [ ] 6.2 Add the print stylesheet to `src/app/globals.css`
    - The `@media print` and `@page` rules from design "Print stylesheet" (hide header, language list, skip link, print control, footer; black on white; page break between blocks; `a.portal-link::after` URL text; no collapsed regions)
    - Make sure the focus indicator rule is at least 2 CSS pixels and not overridden
    - _Requirements: 13.5, 15.2, 15.4_
    - Done when: `npm run build` passes.

- [ ] 7. Integration and browser verification
  - [ ] 7.1 Write the full-journey e2e test in `tests/e2e/journey.spec.ts`
    - For `es` and then `en`: demo fill → submit → confirm all → three cards in order RAFT, SNAP, UTIL with text dimensions, "Demo rule" label, no external links, and the no-deadline text → documents (`E-ID` listed once with three actions) → help (utility "can't tell yet", legal-aid notice, three statements) → handoff (two `lang` blocks)
    - Assert focus is on the `h1` after each step change, and complete the journey using keyboard only (Tab, Enter, Space)
    - _Requirements: 1.4, 2.2, 7.1, 7.7, 7.10, 9.7, 10.1, 11.1, 11.3, 11.6, 13.2, 14.1, 15.1, 15.8_
    - Done when: `npx playwright test tests/e2e/journey.spec.ts` passes on desktop and mobile Chromium.
  - [ ] 7.2 Write the language-switch and reload e2e test in `tests/e2e/locale-switch.spec.ts`
    - On `/confirm`, set `window.__bridgeMarker = 1`, click the other language, then assert the marker survives, the URL prefix and `html[lang]` changed, and every fact value and confirmation state matches
    - Reload `/actions` and assert the empty-session message with a link to step 1 and no cards
    - _Requirements: 12.4, 12.5, 12.6, 12.7_
    - Done when: `npx playwright test tests/e2e/locale-switch.spec.ts` passes.
  - [ ] 7.3 Write the privacy e2e test in `tests/e2e/privacy.spec.ts`
    - After the full journey: `context.cookies()` is empty, `localStorage` and `sessionStorage` length is 0, no request URL or body contains intake text (for example "Boston"), and no third-party or analytics request is made
    - _Requirements: 1.6, 14.2, 14.3, 14.4, 14.5_
    - Done when: `npx playwright test tests/e2e/privacy.spec.ts` passes.
  - [ ] 7.4 Write the print e2e test in `tests/e2e/print.spec.ts`
    - On `/handoff` with `page.emulateMedia({ media: "print" })`: header, language switcher, and print button are hidden; both blocks are visible; no text is clipped by `overflow: hidden`; exactly one print button exists in screen media and is keyboard-focusable
    - _Requirements: 13.5, 13.6_
    - Done when: `npx playwright test tests/e2e/print.spec.ts` passes.
  - [ ] 7.5 Write the accessibility e2e test in `tests/e2e/a11y.spec.ts`
    - Run an axe scan on each of the six steps in both locales at desktop width and at 320 px, attach the violation count per step and locale as a test annotation, and assert `scrollWidth <= clientWidth` at 320 px
    - Assert exactly one `h1` per step
    - _Requirements: 15.3, 15.5, 15.6_
    - Done when: `npx playwright test tests/e2e/a11y.spec.ts` passes with zero axe violations and no horizontal scroll at 320 px.
  - [ ] 7.6 Run the full verification suite and fix any failures
    - Run `npm run typecheck`, `npm run lint`, `npx vitest --run`, `npm run build`, and `npx playwright test`
    - _Requirements: 3.10, 12.2, 16.13_
    - Done when: all five commands exit with code 0.
  - [ ] 7.7 Final checkpoint
    - Ensure all tests pass, ask the user if questions arise.
    - _Requirements: 16.13_
    - Done when: the task 7.6 commands all pass on a clean run.

## Notes

- No task is optional. Property tests 1–18 each map to one design property and run at least 100 cases.
- The Req 15.6 record (axe run date and violation counts, with no WCAG conformance claim) is written to docs from the 7.5 annotations as part of the end-of-turn doc upkeep, not as a separate task.
- E2E tests are split into five files (design named one) so they can be written in parallel. Coverage matches design "Testing Strategy".
- Input validation lives in `src/lib/session/validation.ts` (design left the file unnamed) so it stays React-free and unit-testable.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["1.4", "1.5"] },
    { "id": 4, "tasks": ["1.6", "2.1", "2.4", "2.6"] },
    { "id": 5, "tasks": ["2.2", "2.5", "2.7", "2.10"] },
    { "id": 6, "tasks": ["2.3", "2.8", "2.11", "2.18", "2.19"] },
    { "id": 7, "tasks": ["2.9", "2.12", "2.20", "2.22"] },
    { "id": 8, "tasks": ["2.13", "2.21", "2.23"] },
    { "id": 9, "tasks": ["2.14", "2.24"] },
    { "id": 10, "tasks": ["2.15"] },
    { "id": 11, "tasks": ["2.16"] },
    { "id": 12, "tasks": ["2.17"] },
    { "id": 13, "tasks": ["2.25"] },
    { "id": 14, "tasks": ["2.26"] },
    { "id": 15, "tasks": ["3.1", "3.2"] },
    { "id": 16, "tasks": ["3.3", "4.1"] },
    { "id": 17, "tasks": ["3.4", "5.1"] },
    { "id": 18, "tasks": ["3.5", "5.2"] },
    { "id": 19, "tasks": ["4.2"] },
    { "id": 20, "tasks": ["4.3", "4.4", "6.1"] },
    { "id": 21, "tasks": ["6.2"] },
    { "id": 22, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5"] },
    { "id": 23, "tasks": ["7.6"] },
    { "id": 24, "tasks": ["7.7"] }
  ]
}
```
