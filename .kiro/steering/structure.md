---
inclusion: auto
name: structure
description: Planned Bridge MA folder layout and naming. Use when creating, moving, or organizing source, fixture, test, or docs files.
---
# Structure

Exists now:
```
src/app/[lang]/layout.tsx      root layout per locale (sets <html lang>, skip link, footer)
src/app/[lang]/page.tsx        landing shell
src/app/[lang]/story/page.tsx  step 1 placeholder (intake not built)
src/app/globals.css            base responsive + print styles
src/components/                React components (SiteHeader)
src/lib/i18n/                  en.json, es.json, index.ts (locales, resolveLocale, getDictionary)
src/lib/data/programs.ts       fixture types + validating loader
src/lib/rules/types.ts         shared team contract (all domain types incl. BridgeEvaluationResult)
src/lib/model/adapter.ts       ModelAdapter interface + deterministic demo fallback
src/fixtures/programs.v2.json  sources, programs, facts, rules, actions, evidence, edges (version, sources[])
tests/unit/                    Vitest
tests/property/                Vitest + fast-check (`*.property.test.ts`)
tests/e2e/                     Playwright + axe (`*.spec.ts`)
docs/                          brief, decisions, backlog, registers, Kiro usage, playbook
```

Rules:
- `/` redirects to `/en`; every route lives under `src/app/[lang]/`. Only `en` and `es` are built (`dynamicParams = false`).
- `src/lib/rules` and `src/lib/data` must not import `@/lib/model`, React, or Next (ESLint enforced).
- Planned (see .kiro/specs/action-graph/design.md):
  - `src/lib/rules/{facts,engine,deadline,graph,validate,handoff,bridge}.ts`
  - `src/lib/session/{store,validation}.ts`
  - `src/lib/i18n/localize.ts`
  - `src/lib/model/explain.ts`
  - `src/components/steps/*Step.tsx`
  - `src/components/{ActionCard,StepHeading,RequireSession,HtmlLangSync,useJourney,useSession}.ts(x)`
  - `src/app/layout.tsx` (static root)
  - routes `/[lang]/{story,confirm,actions,documents,help,handoff}`
  - `src/fixtures/programs.v2.json` (replaces v1)
- Contract files (`src/lib/rules/types.ts`, fixture schema) change only with team coordination.
- Fixture files are named `<topic>.v<N>.json`.
- Config: `vitest.config.mts` (ESM), `playwright.config.ts`, `eslint.config.mjs`, `next.config.ts`, `.nvmrc` (Node 24), `.gitattributes` (LF).
