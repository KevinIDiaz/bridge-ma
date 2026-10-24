# Decisions

Status: `approved` = set by the developer; `provisional` = proposed by Kiro, awaiting developer review.

| ID | Date | Decision | Status | Notes |
|----|------|----------|--------|-------|
| D-001 | 2026-10-24 | Product scope: SNAP, RAFT, utility shutoff protection only; six-step journey | approved | From developer brief |
| D-002 | 2026-10-24 | Fictional demo persona (Spanish-speaking Boston single parent, job loss, Notice to Quit) | approved | From developer brief |
| D-003 | 2026-10-24 | Stack: Next.js, TypeScript, npm, local versioned JSON fixtures, EN/ES dictionaries | approved | From developer brief |
| D-004 | 2026-10-24 | Provider-independent model adapter with deterministic demo fallback; models never decide outcomes | approved | From developer brief |
| D-005 | 2026-10-24 | Testing: Vitest, fast-check, Playwright | approved | From developer brief |
| D-006 | 2026-10-24 | No auth, persistence, analytics, or database | approved | From developer brief |
| D-007 | 2026-10-24 | Teammate playbook is reference material, not approved scope | approved | From developer brief |
| D-008 | 2026-10-24 | Steering modes: product, safety-and-provenance, solo-workflow = always; tech, accessibility, testing = fileMatch; structure = auto | provisional | Keeps always-loaded context short |
| D-009 | 2026-10-24 | Folder layout in .kiro/steering/structure.md (`src/app`, `src/lib/rules`, `src/fixtures`, `tests/`) | provisional | Not scaffolded yet |
| D-010 | 2026-10-24 | Tri-state facts (`true/false/unknown`) plus `confirmed` flag; status labels "may match / likely does not match / can't tell yet" | provisional | Wording needs review in Spanish |
| D-011 | 2026-10-24 | Policy content renders as guidance only if its source is `reviewed` in source-register.md | provisional | Enforces provenance boundary |
| D-012 | 2026-10-24 | Git default branch `main`, single repo at workspace root | provisional | Initialized by Kiro |
| D-013 | 2026-10-24 | Deployment target | provisional | Not yet chosen; GitHub CLI not installed (see README) |
| D-014 | 2026-10-24 | Doc upkeep via always-loaded checklist in solo-workflow.md plus a UserPromptSubmit agent hook; every reply ends with "Docs updated: …" | provisional | Chosen over a Stop hook to avoid possible re-trigger loops |
| D-015 | 2026-10-24 | Teammate playbook saved verbatim at docs/bridge-build-playbook.md as reference only. Scope comes from project-brief.md, decisions.md, and the approved spec. Its alternative concepts and Mass.gov claims are not requirements; claims enter fixtures only after review in source-register.md | approved | From developer instruction; applies D-007 |
