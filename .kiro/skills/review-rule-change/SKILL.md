---
name: review-rule-change
description: Review changes to Bridge MA program sources, fixtures, or rule logic for schema validity, official evidence, referential integrity, freshness, conflicts, and affected tests. Use when src/fixtures, src/lib/rules, src/lib/data, or docs/source-register.md change.
---
# Review rule change

## Gather
1. `git diff` for `src/fixtures/`, `src/lib/rules/`, `src/lib/data/`, `docs/source-register.md`.
2. Read `.kiro/steering/safety-and-provenance.md` and the relevant spec.

## Check
- Schema: fixture still parses (`npm test` runs the loader tests); version bumped when content changed; file named `<topic>.v<N>.json`.
- Official evidence: every new or changed claim cites a source ID whose official page states that claim. Quote or point to the exact passage. A reachable URL alone does not verify a claim. Playbook text is not evidence.
- Review status: only sources marked `reviewed` with URL, retrieved date, and reviewer in source-register.md may back guidance or deadlines. The fixture and register must agree.
- Referential integrity: no program cites a missing source; no orphan sources; rule IDs unique and referenced.
- Freshness: retrieved date present; flag anything older than the fixture version or pages that may have changed as `stale`.
- Conflicts: two rules or sources disagreeing; Massachusetts vs federal wording; dates or amounts that differ between files.
- Boundaries: unknown never coerced to false; unconfirmed facts ignored; no neighborhood data in matching; model output never decides outcomes; no deadline without a reviewed source.
- Tests: list affected unit/property tests; run `npm test` and `npm run test:property`; note missing tests for new rules.

## Report
Verdict (approve / changes needed), then findings with file:line, the evidence checked, and what was not verified.
