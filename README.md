# Bridge MA

Bridge MA helps a Massachusetts resident turn a crisis into a sourced sequence of next steps across SNAP, RAFT, and utility shutoff protection. Hackachusetts Civic Action project.

> Demo only. Uses fictional data. Not affiliated with any government agency. Does not determine eligibility, give legal advice, or submit applications.

Repo: https://github.com/KevinIDiaz/bridge-ma

## Journey
Tell your story → Confirm facts → View three next actions → See reusable documents → Understand uncertainty / human help → Print bilingual handoff.

## Status
Scaffolded. Built: English/Spanish landing page and a placeholder for step 1. Not built yet: intake, fact confirmation, rules engine, action cards, handoff.

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

## Layout
```
src/app/[lang]/        routes for en and es (landing, story placeholder)
src/components/        React components
src/lib/i18n/          en.json, es.json, locale helpers
src/lib/data/          fixture types and validating loader
src/lib/rules/         deterministic domain code (types only so far)
src/lib/model/         model adapter interface + deterministic demo fallback
src/fixtures/          versioned JSON (programs.v1.json)
tests/unit|property|e2e
```
Domain code in `src/lib/rules` and `src/lib/data` may not import the model adapter, React, or Next (ESLint enforced). No database, authentication, analytics, or production AI provider.

## Environment notes
- Line endings are LF for every file (`.gitattributes`).
- npm 11 may print an `install-scripts` warning for `esbuild` and `unrs-resolver`. Install, tests, and build pass anyway.

## Docs
- [Project brief](docs/project-brief.md)
- [Decisions](docs/decisions.md)
- [Backlog](docs/backlog.md)
- [Source register](docs/source-register.md)
- [MCP register](docs/mcp-register.md)
- [Kiro usage](docs/kiro-usage.md)
- [Build playbook](docs/bridge-build-playbook.md) (reference only, not scope)
- Kiro steering: `.kiro/steering/`
