# Demo scenarios

Fictional data only. Nothing is submitted to any agency. Owner: Teammate 2 (verification, `verify-demo` skill).

## Verification run

- Date: 2026-10-24. Commit: `main` at `df2ca95` (integrated journey).
- Target: local production build (`npm run build`, then `npm start` on port 3000; the serving process was confirmed as `next start`). Not a deployment (D-108).
- Browser: Chromium 1280×900, driven by a temporary Playwright script (deleted after the run). Playwright MCP was not available in this session, so the browser was not driven interactively through MCP.
- Model: no API key configured; the deterministic demo adapter was used.
- Expected values come from the approved spec (`.kiro/specs/action-graph/design.md`, "Expected demo outcome" and the rule tables), decisions D-037 and D-101. Structured outcomes were read from `data-*` attributes, not from on-screen text alone.

Persona demo fill (design): `preferred_language=es`, `city=Boston`, `neighborhood=unknown`, `household_size=2`, `single_parent=true`, `lives_in_ma=true`, `lost_job_recently=true`, `rents_home=true`, `received_notice_to_quit=true`, `has_utility_account=true`, `received_shutoff_notice=unknown`.

Checks repeated in every scenario below, in `en` and `es`: rule `@1`, fixture version 2; every source `unreviewed`, labeled "Unverified", not linked; 0 external links; every deadline `unknown(source_unreviewed)` with the no-deadline text and no digits; "Demo rule" label on every card, document row, and handoff action; explanation labeled "Rule-based explanation (template)"; 6 documents with E-ID used by 3 actions; no upload control; 3 help options and 3 statements; handoff has an `en` and an `es` block with "Fictional demo", the same local date, no `neighborhood`, and no unknown fact shown as No; 1 print button, no form or submit control; print media hides header, language list, and print button with both blocks visible; 0 cookies, 0 localStorage/sessionStorage entries; reloading `/actions` shows 0 cards and a link to step 1; 0 console errors or warnings, 0 failed or 4xx/5xx requests, 0 third-party requests.

## Scenario A: demo fill, every fact confirmed

| Step | Expected | Actual (en) | Actual (es) | Result |
|---|---|---|---|---|
| Actions order | A-RAFT, A-SNAP, A-UTIL | A-RAFT, A-SNAP, A-UTIL | same | pass |
| A-RAFT | may_match, urgent, all_confirmed | may_match, urgent, all_confirmed | same | pass |
| A-SNAP | may_match, standard, all_confirmed, edge RAFT→SNAP | as expected | same | pass |
| A-UTIL | cant_tell, unknown, has_missing; Missing: `received_shutoff_notice`; edge RAFT→UTIL | as expected | same | pass |
| Help | utility can't tell yet; legal-aid notice shown | as expected | same | pass |
| Handoff unknown facts | `received_shutoff_notice: unknown` | as expected | same | pass |

## Scenario B: demo fill, nothing confirmed

| Step | Expected | Actual (en) | Actual (es) | Result |
|---|---|---|---|---|
| Actions order | A-SNAP, A-RAFT, A-UTIL | A-SNAP, A-RAFT, A-UTIL | same | pass |
| Dimensions | all cant_tell, has_unconfirmed; urgency standard / unknown / unknown | as expected | same | pass |
| Not yet confirmed lists | SNAP: lives_in_ma, lost_job_recently; RAFT: + rents_home, received_notice_to_quit; UTIL: lives_in_ma, has_utility_account, received_shutoff_notice; nothing under Missing | as expected | same | pass |
| Edges | Design prose: none. Forward-only rule (D-037, D-101): RAFT→UTIL kept, RAFT→SNAP dropped | RAFT→UTIL only | same | pass against D-101; design prose is out of date (finding F1) |
| Help | snap, raft, utility can't tell yet; no legal-aid notice (Notice to Quit not confirmed) | as expected | same | pass |
| Handoff unknown facts | the six required facts, each `unconfirmed` | as expected | same | pass |

## Scenario C: edit `received_shutoff_notice` to Yes, confirm all

Expected from the rule tables (R-UTIL predicates, urgency trigger, urgency-then-raft/utility/snap order).

| Step | Expected | Actual (en) | Actual (es) | Result |
|---|---|---|---|---|
| Actions order | A-RAFT, A-UTIL, A-SNAP | as expected | same | pass |
| Dimensions | RAFT may_match urgent; UTIL may_match urgent all_confirmed; SNAP may_match standard | as expected | same | pass |
| Edges | RAFT→UTIL, RAFT→SNAP | as expected | same | pass |
| Help | no program can't tell; the "no program is marked can't tell yet" message shown | as expected | same | pass |
| Handoff unknown facts | none | none | none | pass |

## Scenario D: edit `rents_home` to No, confirm all

| Step | Expected | Actual (en) | Actual (es) | Result |
|---|---|---|---|---|
| A-RAFT | likely_not; urgency still urgent (Notice to Quit confirmed true); first | as expected | same | pass |
| A-SNAP, A-UTIL | unchanged from Scenario A | as expected | same | pass |
| Help | utility can't tell yet; legal-aid notice shown | as expected | same | pass |

## Scenario E: language switch on step 2

| Check | Expected | Actual (en→es) | Actual (es→en) | Result |
|---|---|---|---|---|
| No document reload | window marker survives | survives | survives | pass |
| `<html lang>` | other locale | changed | changed | pass |
| Fact values and confirmation states | identical | identical | identical | pass |

## Commands (README)

| Command | Result |
|---|---|
| `npm ci` | 0 vulnerabilities (eslint 9.39.5 deprecation warning) |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm test` | 25 files, 146 tests passed |
| `npm run test:property` | 10 files, 28 tests passed |
| `npm run build` | exit 0, 17 static pages |
| `npm run test:e2e` | 80 passed, 0 skipped (desktop + Pixel 7 Chromium) |
| `npm start` | `/` → 307 `/en`; `/en`, `/es/story`, `/es/confirm`, `/es/actions`, `/es/handoff` → 200; `/fr` → 404 |
| `npm run dev` | ready on port 3000; `/` → 307 `/en`, `/en` → 200 |
| `npm run validate:locales` (not in README) | pass, 201 keys |
| `npm run validate:provenance` (not in README) | pass, `programs.v2.json`: 3 sources, 3 rules, 3 actions, 2 edges |

Machine: Node v22.21.0 (`.nvmrc` says 24; `engines` allows ≥22.12).

## Automated accessibility record (Req 15.6)

axe (`@axe-core/playwright` 4.14.0, tags wcag2a/2aa/21a/21aa/22aa), 2026-10-24, `df2ca95`, desktop and Pixel 7 Chromium; steps 3–6 also at 320 px.

| Step | en | es | Spec |
|---|---|---|---|
| story | 0 | 0 | `landing.spec.ts` |
| confirm | 0 | 0 | `a11y.spec.ts` |
| actions, documents, help, handoff | 0 | 0 (no horizontal scroll at 320 px) | `a11y.spec.ts` |

Automated checks are not full validation. No manual screen-reader testing or expert review has been done. No WCAG conformance is claimed.

## Findings

| ID | Severity | Finding | Owner |
|---|---|---|---|
| F1 | P2 (docs) | Design "Expected demo outcome" says no edges are kept before confirmation; the forward-only rule keeps RAFT→UTIL. Code and `tests/unit/graph.test.ts` follow the rule (D-101); the design prose was not updated | Lead |
| F2 | P2 (docs) | README "Status" still says the rules engine and steps 1–6 are not built; "Layout" lists only landing and story routes; Scripts table omits `validate:locales` and `validate:provenance` | Lead |
| F3 | P2 | `npm start` and `npm run dev` listen on all interfaces (Next prints a LAN "Network" URL). Data is fictional and the app has no backend, but presenters on shared Wi-Fi should know the demo is reachable on the LAN | Info |
| F4 | P2 (UX) | Handoff fact labels end in "?:" (question label + CSS colon); `received_shutoff_notice` appears under both confirmed answers ("I don't know") and answers still needed; "Demo rule" label repeats on every document row | T2 (CSS, labels), Lead (packet) |

Not verified: source URL reachability (no source has a URL; all are `unreviewed` in `docs/source-register.md`); invalid-input recovery on intake (Teammate 1's product audit covers it); a real model provider (none configured).
