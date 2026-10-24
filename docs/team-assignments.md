# Team assignments

Source: division of labor supplied by the Lead (repo owner, KevinIDiaz), saved 2026-10-24.

Who is who: the repo owner was "Teammate 1" only for Stage 1 (writing the spec, done at commit `4eecbbb`). From Stage 2 on, the repo owner is the **Lead**. "Teammate 1" and "Teammate 2" in Stages 2–5 are the other two developers.

## Path mapping (read this first)

The plan below was written before the design. It names folders like `src/domain/` and `src/features/intake/`. The approved design uses different folders, and the design wins. Use this mapping; the same table is in `.kiro/steering/team.md`, which every Kiro agent loads.

| Plan path | Actual path in this repo |
|---|---|
| `src/domain/`, `src/data/rules/`, `src/data/sources/`, schema/validator modules | `src/lib/rules/`, `src/lib/data/`, `src/fixtures/programs.v2.json` |
| `tests/domain/` | `tests/unit/` (domain tests), `tests/property/` |
| `src/features/intake/`, `src/components/intake/` | `src/lib/session/`, `src/components/steps/IntakeStep.tsx`, `src/components/steps/ConfirmStep.tsx`, `src/components/{StepHeading,RequireSession}.tsx`, `src/components/useSession.ts`, `src/app/[lang]/{story,confirm}/` |
| `tests/intake/` | `tests/unit/{store,validation}.test.ts` |
| `src/features/action-plan/`, `src/components/action-plan/`, `src/features/handoff/`, `src/components/handoff/` | `src/components/steps/{Actions,Documents,Help,Handoff}Step.tsx`, `src/components/ActionCard.tsx`, `src/app/[lang]/{actions,documents,help,handoff}/` |
| `src/locales/` | `src/lib/i18n/` (`en.json`, `es.json`, `localize.ts`) |
| `tests/action-plan/`, `tests/e2e/`, `scripts/validate-*.*`, `docs/demo-scenarios.md` | same paths |

Shared contract: `src/lib/rules/types.ts` (includes `BridgeEvaluationResult`) and the `programs.v2.json` schema. Lead approval required to change them.

---

## Original plan (verbatim)

Bridge MA — Parallel Build Assignments

Goal

Finish the smallest reliable Bridge MA demo as quickly as possible with three developers and three separate Kiro agents.

Required demo:

A fictional resident enters their situation.
The resident confirms structured facts, including “unknown.”
Deterministic fixtures produce SNAP, RAFT, and utility-protection actions.
Every action shows why it appeared, uncertainty, source status, and the next step.
At least one document is reusable across programs.
English/Spanish switching works.
A bilingual printable handoff works.

Do not add voice, OCR, accounts, a database, an equity map, real agency submission, or other stretch features until the integrated demo passes.

Important dependency before parallel work

Teammate 1 is currently completing Prompt 5: the Action Graph requirements, design, and tasks.

Nobody should implement against guessed contracts. Teammate 1 must first:

Finish and review requirements.
Finish and review design.
Generate the minimal task list.
Commit and push the spec.
Send the exact commit SHA to the team.

All three developers must branch from that same commit.

Branch setup

Each developer should run:

git fetch origin
git checkout main
git pull --ff-only

Then create the assigned branch:

Lead developer: feature/core-action-graph
Teammate 1: feature/intake-flow
Teammate 2: feature/action-plan-handoff

If main uses a different default branch, use that branch instead.

File-ownership rule

Do not edit another owner’s directories without asking first.

Lead owns deterministic domain logic, rule/source fixtures, and domain tests.
Teammate 1 owns intake, confirmation, and intake tests.
Teammate 2 owns recommendation presentation, locales, printable handoff, browser tests, and validators.
Only the lead resolves shared-contract changes and integration conflicts.

All agents must preserve existing work, avoid unrelated refactors, and report actual test results.

Stage 1 — Teammate 1 finishes the shared spec

Owner

Teammate 1

Mode

Standard Spec — Requirements First

Must finish before parallel implementation

.kiro/specs/action-graph/requirements.md
.kiro/specs/action-graph/design.md
.kiro/specs/action-graph/tasks.md
The shared result contract and domain types

The design should define at least:

ResidentFact
Source
RuleVersion
EvidenceType
EvidenceRequirement
ProgramEvaluation
ActionNode
ActionEdge
Deadline
HandoffPacket
BridgeEvaluationResult

Suggested integration shape:

BridgeEvaluationResult contains resident facts, program evaluations, actions, graph edges, reusable evidence, and handoff data.

Completion message to team

“The Action Graph spec is approved and pushed at commit [SHA]. Branch from this commit. Shared contracts are [path]. Do not change them without coordination.”

Stage 2 — Three parallel implementation streams

Lead Developer — Core Action Graph

Branch

feature/core-action-graph

Own these paths

src/domain/
src/data/rules/
src/data/sources/
tests/domain/
Source/rule schema and validator modules

Build in this order

Implement the shared types exactly as approved.
Implement source and rule schemas.
Add clearly separated synthetic demo fixtures.
Implement deterministic SNAP, RAFT, and utility evaluations.
Implement graph construction.
Implement graph validation.
Implement evidence-reuse relationships.
Implement typed unknown deadlines.
Add unit tests.
Add fast-check property tests.
Export BridgeEvaluationResult for the UI branches.
Run tests and typecheck.
Commit and push.

Kiro prompt

Read the approved action-graph spec, project steering, decisions, and Git
status.

I own only the deterministic domain layer and source/rule fixtures.

Implement the approved shared contracts, source/rule schema validation,
deterministic evaluation for the three demo programs, action-graph
construction and validation, evidence reuse, and typed unknown deadlines.

Required properties:
identical inputs and rule versions give identical results
unknown required facts produce unknown predicates
every recommendation references an existing source and rule version
no duplicate action IDs
no dangling edges
graph cycles are rejected
unsupported deadlines remain explicitly unknown
display language cannot change evaluation

Use verified records where available and visibly synthetic fixtures
otherwise. Do not invent Massachusetts policy.

Do not edit React components, intake files, locales, printable views, or
browser tests.

Run domain tests and typecheck. Update only tasks completed by this branch.
Invoke capture-kiro-evidence. Commit and push a bounded working milestone.
Report exported interfaces and integration instructions.

Done means

Domain code runs without React or an AI provider.
Property tests pass.
Every action has valid rule/source references.
The branch exports one stable BridgeEvaluationResult.
No UI files were changed.

Teammate 1 — Intake and Fact Confirmation

Branch

feature/intake-flow

Own these paths

src/features/intake/
src/components/intake/
tests/intake/

Build in this order

Create fictional text intake.
Convert the form into draft ResidentFact values.
Add an explicit “unknown” choice where applicable.
Add the confirmation screen.
Allow correction before confirmation.
Prevent unconfirmed facts from reaching evaluation.
Add understandable validation and error recovery.
Add keyboard-completable interaction.
Add intake tests.
Run tests and typecheck.
Commit and push.

Kiro prompt

Read the approved Action Graph spec, steering, and shared contracts.

I own only the intake and fact-confirmation flow.

Implement:
fictional text intake
draft ResidentFact-compatible values
unknown as an explicit state distinct from false
explicit confirmation before evaluation
editing and correction
required versus optional explanations
understandable errors and recovery
keyboard-completable interaction

Do not implement the rule engine, recommendation cards, source records,
printable handoff, voice, or OCR.

If the real shared contracts are not yet present on this branch, create a
small feature-local adapter that documents its assumptions. Do not redefine
global contracts.

Add tests for confirmed facts, unknown facts, corrections, validation
errors, and stable structured values.

Run tests and typecheck. Invoke capture-kiro-evidence. Commit and push.
Report assumptions and the props/callback expected by integration.

Done means

A resident can enter, correct, and confirm fictional facts.
Unknown is not silently converted to false.
Unconfirmed facts cannot start evaluation.
Keyboard navigation works through the intake.
The component exposes a clean confirmed-facts output.

Teammate 2 — Action Plan, Languages, Handoff, and Verification

Branch

feature/action-plan-handoff

Own these paths

src/features/action-plan/
src/components/action-plan/
src/features/handoff/
src/components/handoff/
src/locales/
tests/action-plan/
tests/e2e/
scripts/validate-*.*
docs/demo-scenarios.md

Build in this order

Create typed fixture data matching BridgeEvaluationResult.
Build three recommendation cards.
Show why, missing facts, uncertainty, source state, and next action.
Build the reusable-evidence view.
Add English/Spanish dictionaries and switching.
Ensure translation changes only display text.
Build the bilingual printable handoff.
Add locale parity validation.
Add rule/source referential-validation command if the lead has not supplied it.
Add component tests.
Prepare Playwright scenarios using stable labels/roles.
Run available checks.
Commit and push.

Kiro prompt

Read the approved Action Graph requirements and design.

I own presentation of an already-computed BridgeEvaluationResult, locale
dictionaries, printable handoff, and demo verification.

Build:
three recommendation cards
separate matching, urgency, source-freshness, confirmation, and
  explanation-origin displays
why each action appeared
missing information
immediate next action
official source and review status
human handoff
reusable-document view
English/Spanish switching
bilingual printable handoff

The UI must not calculate eligibility, deadlines, or graph relationships.
Use typed fixture data behind a replaceable adapter until the domain branch
is merged.

Add tests proving:
missing and unknown states stay visible
stale/unverified sources are not presented as authoritative
language switching preserves IDs, dates, decisions, and graph structure
critical controls work by keyboard and at mobile width

Create locale key and interpolation-placeholder validation.
Prepare deterministic Playwright scenarios using fictional data only.
Do not call or submit to real agencies.

Do not edit intake or domain evaluation logic.

Run available tests and typecheck. Invoke capture-kiro-evidence. Commit and
push. Report integration prerequisites and any tests blocked on the merged
journey.

Done means

Three clear cards render from structured data.
English/Spanish switching does not change outcomes.
Evidence reuse is visible.
The handoff prints cleanly in both languages.
Browser-test scenarios are ready for the integrated flow.
No evaluation logic exists in the UI.

Stage 3 — Integration

Owner

Lead developer

Merge order

feature/core-action-graph
feature/intake-flow
feature/action-plan-handoff

Do not merge all branches blindly. Merge and test one at a time.

Integration prompt

Read the approved spec and inspect the merged implementation.

Connect:
intake -> confirmed ResidentFact values -> deterministic domain evaluation ->
BridgeEvaluationResult -> action-plan presentation -> printable handoff.

Remove temporary adapters only when the real shared result is available.
Do not copy domain logic into components.

Resolve interface mismatches centrally and make the smallest contract-safe
change.

Run:
typecheck
lint
unit tests
property tests
locale validation
source/rule validation
production build

Then run the complete fictional journey in English and Spanish.

Identify integration failures separately from feature defects.
Fix P0 issues and demo-blocking P1 issues only.
Invoke capture-kiro-evidence. Commit and push the integrated milestone.

Integration acceptance checklist

Intake reaches confirmation.
Unknown values remain unknown.
Confirmed facts reach the domain engine.
The engine returns three structured actions.
The UI renders the same structured results in both languages.
One document is visibly reusable.
Unsupported deadlines show unknown rather than an invented date.
Every action displays source status and human help.
Printable handoff contains only confirmed fictional data.
No agency form is submitted.
All required checks pass.

Lead carry-overs from Stage 2 (added 2026-10-24, D-105; no change to teammates' Stage 2 work)

- `explain.<programId>.<status>` keys (3 programs × 3 statuses) exist in both `en.json` and `es.json`. They are part of Teammate 2's task 2.19 already. If any are missing at merge, the Lead adds them while resolving the integration.
- `useJourney` (task 4.1) wraps `evaluateBridge`. `ActionsStep` calls `explainWithFallback(getModelAdapter(), { programId, status, locale })` from `src/lib/model/explain.ts`, stores results in Session_State, and passes origins back as `explanationOrigins`. An empty explanation text hides the explanation region (D-104).
- Any test that asserts edges before confirmation expects only `A-RAFT → A-UTIL` (D-101).
- Properties 10 and 16 (tasks 2.20, 2.21) exist and pass. If they are missing, the Lead lists them in the Stage 4 fix list rather than reopening Stage 2.

Stage 4 — Parallel audit after integration

After integration, parallelize review rather than new implementation.

Teammate 1 — Product/UX audit

Use the product-critic agent and product-ux-review skill.

Test:

Normal path
Missing-information path
Invalid/error path
English/Spanish switch
Keyboard-only completion
Mobile viewport
Printable handoff

Report observed P0/P1/P2 findings only. Do not edit code during the audit.

Teammate 2 — Verification and demo readiness

Use verify-demo.

Check:

Structured outcomes
Source links
Unknown deadlines
Synthetic-data labels
Console errors
Network errors
Production build
Playwright scenarios
README commands
Demo flow

Update docs/demo-scenarios.md with expected versus actual results.

Lead — Critical fixes

Wait for both reports, then:

Fix every supported P0.
Fix only demo-blocking or high-impact P1 issues.
Do not add new features.
Rerun affected tests and journeys.
Capture Kiro evidence.
Commit and push.

Stage 5 — Hooks, CI, deployment, and evidence

Teammate 2

Create only these two hooks after the validator commands work:

validate-rule-provenance
check-locale-parity

Demonstrate each with deliberate fault injection:

One temporary missing source reference
One temporary missing locale key

Restore valid state and confirm success. Record the exercise honestly in docs/kiro-usage.md.

Create CI using the repository’s actual commands:

npm ci
typecheck
lint
unit tests
property tests
source validation
locale validation
production build

Lead

~~Prepare and deploy the simplest public build. Verify the complete deployed journey, not only the homepage.~~

Changed 2026-10-24 (D-108): no deployment. Submission is the GitHub link plus a video demo. Run a local production build (`npm run build`, then `npm start`), verify the complete journey in English and Spanish (not only the homepage), and make sure README run instructions work from a fresh clone.

Teammate 1

Draft the final Kiro narrative from actual evidence:

Standard Spec usage
Steering boundaries
MCP calls that actually occurred
Skills actually invoked
Hooks actually triggered
Property tests
Product-critic findings and fixes
Tools or ideas deliberately deferred
Honest limitations

Do not invent time savings, bugs, successful checks, or feature usage.

Coordination messages

When starting work

“I am starting [task] on [branch]. I will only edit [paths]. My expected output is [artifact].”

When blocked

“I am blocked by [specific dependency]. I have not changed the shared contract. I can continue with [safe independent work].”

Before changing a shared type

“I need to change [type] because [requirement]. Current consumers are [paths]. Proposed change is [change]. Lead approval required before implementation.”

When finishing

“My branch is [branch], latest commit is [SHA]. Checks run: [actual commands/results]. Known limitations: [list]. Integration instructions: [list].”

Non-negotiable rules for every Kiro agent

Read steering, the approved spec, and Git status first.
Work only inside assigned paths.
Do not change shared contracts without lead approval.
Do not add dependencies without explaining why.
Do not implement stretch scope.
Do not invent government policy.
Do not claim unrun checks passed.
Do not expose secrets or use real resident data.
Do not overwrite teammates’ uncommitted work.
Do not submit anything to a real agency.
Capture evidence only from actual actions and results.

Fastest-path rule

If the integration is behind schedule, cut polish in this order:

Animation and decorative visuals
Advanced copy refinements
Extra action-detail panels
Noncritical browser scenarios
Optional model-adapter behavior

Never cut:

Fact confirmation
Unknown versus false
Deterministic evaluation
Source and uncertainty display
Three actionable recommendations
English/Spanish parity
Printable handoff
Property tests for core invariants