# Bridge MA

Bridge MA helps a Massachusetts resident turn a crisis into a sourced sequence of next steps across SNAP, RAFT, and utility shutoff protection. Hackachusetts Civic Action project.

> Demo only. Uses fictional data. Not affiliated with any government agency. Does not determine eligibility, give legal advice, or submit applications.

Repo: https://github.com/KevinIDiaz/bridge-ma

## Journey
Tell your story → Confirm facts → View three next actions → See reusable documents → Understand uncertainty / human help → Print bilingual handoff.

## Status
All six journey steps work end to end in English and Spanish on `main`. The deterministic rules engine and action graph sit behind `evaluateBridge` (`src/lib/rules/bridge.ts`); the shared contract is `src/lib/rules/types.ts`. Every source is still `unreviewed`, so every rule is labeled "Demo rule" and no deadline is shown. Submission is this repo plus a video demo of a local production build (D-108).

## Team workflow
Three developers work in parallel. Roles, branches, owned paths, and task IDs are in `.kiro/steering/team.md` (loaded by every Kiro agent); the full plan is `docs/team-assignments.md`. Tell your Kiro agent your role (Lead, Teammate 1, or Teammate 2) at the start of a session. Contract files (`src/lib/rules/types.ts`, the fixture schema) change only with Lead approval.

## Requirements
- Node.js 22.12+ (developed on 24 LTS; see `.nvmrc`)
- npm 10+
- Git; GitHub CLI (`gh`) for publishing

## Setup
```powershell
npm ci
npx playwright install chromium   # only needed for e2e tests
npm run dev                       # http://localhost:3000 -> redirects to /en
```

## Scripts
| Script | What it does |
|--------|--------------|
| `npm run dev` | Next.js dev server |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm test` | All Vitest tests (unit + property) |
| `npm run test:property` | fast-check property tests only |
| `npm run test:e2e` | Playwright + axe; builds and starts the app on port 3100 |
| `npm run build` | Production build |
| `npm start` | Serve the production build at http://localhost:3000 (use this for the demo video). It listens on every network interface; on shared Wi-Fi use `npm start -- -H localhost` |
| `npm run validate:locales` | `en`/`es` key parity and placeholder check |
| `npm run validate:provenance` | Rule/source referential and provenance check for `programs.v2.json` |

## Layout
```
src/app/[lang]/        routes for en and es (landing, story, confirm, actions, documents, help, handoff)
src/lib/session/       in-memory session store and input validation
src/components/steps/  one client component per journey step
src/components/        React components
src/lib/i18n/          en.json, es.json, locale helpers
src/lib/data/          fixture types and validating loader
src/lib/rules/         deterministic domain code (engine, deadlines, graph, validator, handoff, evaluateBridge)
src/lib/model/         model adapter interface + deterministic demo fallback
src/fixtures/          versioned JSON (programs.v2.json)
tests/unit|property|e2e
```
Domain code in `src/lib/rules` and `src/lib/data` may not import the model adapter, React, or Next (ESLint enforced). No database, authentication, analytics, or production AI provider.

## Environment notes
- Line endings are LF for every file (`.gitattributes`).
- ESLint stays on 9.x: Next's lint plugins (`eslint-plugin-react`, `jsx-a11y`, `import`) don't accept ESLint 10 yet. TypeScript stays on 5.9: `typescript-eslint` requires `<6.1`.
- `package.json` `allowScripts` approves the `unrs-resolver` postinstall (pulled in by `eslint-config-next`) for npm 11.

## Docs
- [Project brief](docs/project-brief.md)
- [Decisions](docs/decisions.md)
- [Backlog](docs/backlog.md)
- [Source register](docs/source-register.md)
- [MCP register](docs/mcp-register.md)
- [Kiro usage](docs/kiro-usage.md)
- [Build playbook](docs/bridge-build-playbook.md) (reference only, not scope)
- Kiro steering: `.kiro/steering/`
- Kiro skills: `.kiro/skills/` (product-ux-review, verify-demo, review-rule-change, capture-kiro-evidence)
- Kiro agent: `.kiro/agents/product-critic.md` (read-only UX reviewer, run with `/product-critic`)
- MCP: `.kiro/settings/mcp.json` (Playwright, Context7)
