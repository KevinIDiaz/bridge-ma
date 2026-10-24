---
name: verify-demo
description: Run the approved fictional Bridge MA demo scenarios end to end and check structured outcomes, console and network errors, source links, and fallback behavior. Use before a demo, deploy, or submission, or when asked to verify the demo works.
---
# Verify demo

## Scope
- Only approved fictional scenarios: those in `docs/project-brief.md`, `docs/decisions.md` (approved rows), and approved specs. The playbook is not a scenario source.
- Never enter real personal data. Never submit to a real agency or third-party form. Official portal links may be checked for reachability, not used.

## Steps
1. Confirm the target: local production build (`npm run build` then `npm run start`) or the deployed URL. Record which.
2. Use Playwright MCP if available; otherwise run `npm run test:e2e` and say the browser was not driven interactively.
3. For each scenario, in `/en` and `/es`:
   - Walk every journey step that exists. Note steps not built yet instead of failing them silently.
   - Compare structured outcomes (status, missing facts, rule ID, fixture version, deadline) with what the deterministic rules and fixtures should produce. Do not trust on-screen text alone.
   - Read console errors and warnings, and failed network requests (4xx/5xx).
   - Check each source link: present, points to the source in `src/fixtures`, and shows review status. A reachable URL does not prove the claim.
   - Fallback: confirm the demo works with no model API key (deterministic demo adapter).
4. Print view of the handoff, if built: readable without color, both languages.

## Report
A table per scenario: step, expected, observed, pass/fail/not built, evidence. Then a list of console/network errors. Never mark a step passed without observing it.
