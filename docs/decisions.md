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
| D-016 | 2026-10-24 | Public GitHub repo at https://github.com/KevinIDiaz/bridge-ma, remote `origin`, branch `main` | approved | Developer asked for the repo after the public-visibility warning; the hackathon requires a public repo |
| D-017 | 2026-10-24 | Pinned versions compatible with Node 20.18.0: next 16.4.3, react 19.3.1, typescript 5.9.3, eslint 9.39.5, vitest 4.1.12 + vite 6.4.5, fast-check 4.10.2, @playwright/test 1.64.1, @axe-core/playwright 4.13.0 | provisional | Newest vitest/eslint/axe need Node 20.19+ or 22.12+. Upgrading Node to 22 LTS would allow newer versions |
| D-018 | 2026-10-24 | Locale in URL: `src/app/[lang]` for `en`/`es`, `/` redirects to `/en`, language switch is a full page load so `<html lang>` updates | provisional | Superseded by D-031 |
| D-019 | 2026-10-24 | Plain CSS (`globals.css`), no CSS framework | provisional | Fewer dependencies |
| D-020 | 2026-10-24 | Start is a link styled as a button, to the step 1 placeholder `/[lang]/story` | provisional | It navigates, so a link is the correct element |
| D-021 | 2026-10-24 | Single fixture `programs.v1.json` holds programs and sources; loader rejects broken source links and `reviewed` sources without URL/date | provisional | Mirrors source-register.md; all sources `unreviewed` |
| D-022 | 2026-10-24 | e2e runs against a production build on port 3100, desktop and mobile Chromium only | provisional | Keeps browser download small |
| D-023 | 2026-10-24 | Node.js 24 LTS for development (`.nvmrc` = 24); `engines.node` = `>=22.12.0`. Pinned package versions from D-017 kept | approved | Developer asked to fix flagged issues; Node 20 reached end-of-life. Updates D-017's Node constraint |
| D-024 | 2026-10-24 | `.gitattributes` forces LF line endings for all files | approved | Developer asked to fix flagged issues; avoids CRLF in steering front-matter and fixtures |
| D-025 | 2026-10-24 | Upgraded vitest 5.0.5, vite 8.3.5, @axe-core/playwright 4.14.0, @types/node 24.19.2. Kept eslint 9.39.5 (Next lint plugins cap at ESLint 9) and typescript 5.9.3 (typescript-eslint requires <6.1). Approved `unrs-resolver` postinstall in `allowScripts` | approved | Developer granted permission to fix and install. Supersedes D-017 versions |
| D-026 | 2026-10-24 | Workspace MCP servers: playwright and context7, with empty `autoApprove`, in `.kiro/settings/mcp.json` | approved | Developer supplied the config. File must be created by the developer (agent write blocked) |
| D-027 | 2026-10-24 | Pin `@playwright/mcp@0.0.83`, the version observed working | approved | Developer asked to pin after verification. Edit pending: agent write to `.kiro/settings/` is blocked, developer applies it. As of 2026-10-24 mcp.json still uses `@latest`. |
| D-028 | 2026-10-24 | Add `src/app/icon.svg` app icon | provisional | Fixes the `/favicon.ico` 404 console error found by Playwright MCP |
| D-029 | 2026-10-24 | Workspace skills: product-ux-review, verify-demo, review-rule-change, capture-kiro-evidence (`.kiro/skills/<name>/SKILL.md`) | approved | Developer request |
| D-030 | 2026-10-24 | Workspace agent `product-critic` (`.kiro/agents/product-critic.md`): tools read, shell, @playwright; denies all file writes, installs, git writes, gh, npx, and Playwright form-fill/upload/unsafe-code tools | approved | Developer request; permission details are provisional |
| D-031 | 2026-10-24 | Language switch is client-side (no full reload) so in-memory Session_State survives; supersedes D-018. Model provider, if ever configured, receives only program ID, MatchStatus, locale; `normalize` stays local | approved | Developer delegated requirements-analysis resolutions to Kiro |
| D-032 | 2026-10-24 | Single fixture `src/fixtures/programs.v2.json` (version 2) holds sources, programs, facts, rules, actions, evidence, edges; replaces programs.v1.json | provisional | From approved design |
| D-033 | 2026-10-24 | Rules are data (single-fact `equals` predicates, Kleene AND) evaluated by one generic engine; replaces per-program snap/raft/utility modules | provisional | From approved design; supersedes the per-program note in D-009 |
| D-034 | 2026-10-24 | Session_State is a module-level in-memory store read via `useSyncExternalStore`, not a React context; lost on reload | provisional | From approved design |
| D-035 | 2026-10-24 | Static root `src/app/layout.tsx` owns `<html>` (inline lang script + `HtmlLangSync`); `[lang]/layout.tsx` becomes nested; language links use `next/link` | provisional | Implements D-031. Soft navigation under Next 16 not yet verified (e2e task 7.2) |
| D-036 | 2026-10-24 | `ModelAdapter` gains a `deterministic` flag; demo adapter explanations are dictionary templates labeled `rule_based` | provisional | From approved design |
| D-037 | 2026-10-24 | Graph builder keeps a fixture edge only when it points forward in the computed order (acyclic by construction) | provisional | From approved design |
| D-038 | 2026-10-24 | Synthetic v1 facts/rules/evidence/edges as in design Data Models; human help: RAFT → legal aid, SNAP → program office, utility → general help line. No amounts, day counts, income limits, or dates | provisional | All sources unreviewed, so all deadlines are unknown(source_unreviewed) |
| D-039 | 2026-10-24 | `buildHandoffPacket` takes `today` as a parameter so domain code never reads the clock | provisional | From approved design |
| D-040 | 2026-10-24 | `BridgeEvaluationResult` (in `src/lib/rules/types.ts`) + `evaluateBridge` (`src/lib/rules/bridge.ts`) are the single integration contract between domain and UI | approved | Required by the team's Stage 1 handoff; developer asked for it |
| D-041 | 2026-10-24 | Task-plan choices: input validation in `src/lib/session/validation.ts`; e2e split into journey, locale-switch, privacy, print, a11y specs; axe counts recorded as test annotations then copied to docs | provisional | From tasks.md |
| D-042 | 2026-10-24 | Shared contract files `src/lib/rules/types.ts` and the `programs.v2.json` schema change only with team coordination. Suggested ownership: Teammate 1 domain (src/lib/rules, src/lib/data, fixture, property tests); Teammate 2 session, steps 1–2, layouts, SiteHeader; Teammate 3 steps 3–6, ActionCard, localize.ts, print | provisional | From design "Shared contracts and team boundaries"; team to confirm |
| D-043 | 2026-10-24 | Action Graph requirements, design, and tasks approved by the developer | approved | Developer approved each phase in chat |
| D-015 | 2026-10-24 | Teammate playbook saved verbatim at docs/bridge-build-playbook.md as reference only. Scope comes from project-brief.md, decisions.md, and the approved spec. Its alternative concepts and Mass.gov claims are not requirements; claims enter fixtures only after review in source-register.md | approved | From developer instruction; applies D-007 |
