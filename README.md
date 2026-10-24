# Bridge MA

Bridge MA helps a Massachusetts resident turn a crisis into a sourced sequence of next steps across SNAP, RAFT, and utility shutoff protection. Hackachusetts Civic Action project.

> Demo only. Uses fictional data. Not affiliated with any government agency. Does not determine eligibility, give legal advice, or submit applications.

Repo: https://github.com/KevinIDiaz/bridge-ma

## Journey
Tell your story in your own words → Review what Bridge understood once → Follow a prioritized action plan with reusable documents and a bilingual handoff.

## Status
The primary three-step journey works end to end in English and Spanish. A server-side conversational assistant extracts proposed facts from natural language and asks one useful follow-up at a time; with no API key it automatically uses a deterministic bilingual demo extractor. The deterministic rules engine and action graph remain behind `evaluateBridge` (`src/lib/rules/bridge.ts`), and model output never decides matching, urgency, order, or deadlines.

The three official Massachusetts source pages were reviewed on 2026-10-24 and are linked from each action. The matching rules remain intentionally simplified and carry a visible "Demo rule" label. Submission is this repo plus a video demo of a local production build (D-108).

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

Optional live AI intake:

```powershell
Copy-Item .env.example .env.local
# Add OPENAI_API_KEY to .env.local. Never commit it.
npm run dev
```

Without `OPENAI_API_KEY`, the same UI and full demo flow use the deterministic fallback. `OPENAI_MODEL` defaults to `gpt-4o-mini` and can be changed to another Responses API model with Structured Outputs support.

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
src/app/[lang]/        EN/ES routes; story, confirm, actions are the primary journey
src/app/api/assistant/ server-only conversational intake endpoint
src/lib/session/       in-memory session store and input validation
src/components/steps/  one client component per journey step
src/components/        React components
src/lib/assistant/     structured LLM adapter, validation, and deterministic fallback
src/lib/i18n/          en.json, es.json, locale helpers
src/lib/data/          fixture types and validating loader
src/lib/rules/         deterministic domain code (engine, deadlines, graph, validator, handoff, evaluateBridge)
src/lib/model/         model adapter interface + deterministic demo fallback
src/fixtures/          versioned JSON (programs.v2.json)
tests/unit|property|e2e
```
Domain code in `src/lib/rules` and `src/lib/data` may not import the assistant, model adapter, React, or Next (ESLint enforced). There is no database, authentication, analytics, or persistence. The optional provider call is server-only, uses Structured Outputs, sends no data unless the resident submits a message, and falls back safely on errors or timeouts.

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
