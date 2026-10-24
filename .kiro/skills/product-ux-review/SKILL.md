---
name: product-ux-review
description: Review a running Bridge MA feature for comprehension, actionability, trust, uncertainty, error recovery, responsive layout, keyboard use, source visibility, and English/Spanish parity. Use when asked to critique, UX-review, or evaluate a built screen or journey step.
---
# Product UX review

Review what is actually running. Do not edit application code.

## Setup
1. Read `docs/project-brief.md`, `.kiro/steering/product.md`, `.kiro/steering/safety-and-provenance.md`, and any spec for the feature under `.kiro/specs/`.
2. Use the app on localhost only (ask the developer for the URL if no server is running). Use fictional data only.
3. Prefer Playwright MCP. If it is unavailable, say so and review from code plus `npm run test:e2e` output, marking findings as "not observed in browser".

## Exercise three paths, in both `/en` and `/es`
- Normal: the fictional persona's happy path.
- Missing information: skip or leave facts unknown. Unknown must stay distinct from "no".
- Failure: bad input, unsupported locale (`/fr`), back/refresh mid-flow, model adapter unavailable (deterministic fallback should still work).

## Check
| Area | Look for |
|------|----------|
| Comprehension | Plain language (~6th–8th grade), one clear purpose per screen |
| Actionability | One obvious next action; portal or human handoff present |
| Trust | Fictional-demo disclosure; no agency impersonation; no eligibility guarantee or legal conclusion |
| Uncertainty | "May match / can't tell yet" visible; missing facts listed; generated text labeled |
| Source visibility | Every action shows source and review status; unreviewed claims not shown as guidance |
| Error recovery | Clear text errors, a way back, nothing lost silently |
| Responsive | Desktop and ~390 px mobile: no clipping, horizontal scroll, or tiny targets |
| Keyboard | Tab order, visible focus, skip link, everything operable without a mouse |
| EN/ES parity | Same content, structure, and actions in both languages; `lang` correct |

## Report
List findings with the path that exposed them and the evidence (URL, element, snapshot or console line):
- P0: unsafe or broken (guarantee, legal conclusion, wrong outcome, journey blocked)
- P1: misleading or hard to complete (missing source, hidden uncertainty, keyboard trap, parity gap)
- P2: polish

Say which checks you did not run. Automated and agent checks are not full accessibility compliance; never claim WCAG conformance.
