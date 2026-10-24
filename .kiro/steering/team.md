---
inclusion: always
---
# Team roles (parallel build)

Three developers, three Kiro agents. Full plan: `docs/team-assignments.md`.

At the start of a session, if the developer has not said their role, ask: Lead, Teammate 1, or Teammate 2. Then edit only that role's paths.

| Role | Branch | Owns | Tasks in `.kiro/specs/action-graph/tasks.md` |
|---|---|---|---|
| Lead (repo owner) | `feature/core-action-graph`; integrates into `main` | `src/lib/rules/`, `src/lib/data/`, `src/fixtures/`, `src/lib/model/`, domain tests in `tests/unit/`, `tests/property/`; at integration `src/components/useJourney.ts` | 1.2–1.6, 2.1–2.18, 2.22–2.26, 4.1, 7.6–7.7 |
| Teammate 1 | `feature/intake-flow` | `src/lib/session/`, `src/components/steps/{IntakeStep,ConfirmStep}.tsx`, `src/components/{StepHeading,RequireSession}.tsx`, `src/components/useSession.ts`, `src/app/[lang]/{story,confirm}/`, `tests/unit/{store,validation}.test.ts` | 3.1–3.5 |
| Teammate 2 | `feature/action-plan-handoff` | `src/lib/i18n/` (dictionaries, `localize.ts`), `src/components/steps/{Actions,Documents,Help,Handoff}Step.tsx`, `src/components/{ActionCard,SiteHeader,HtmlLangSync}.tsx`, `src/app/layout.tsx`, `src/app/[lang]/layout.tsx`, `src/app/[lang]/{actions,documents,help,handoff}/`, `src/app/globals.css`, `tests/e2e/`, `scripts/validate-*`, `docs/demo-scenarios.md` | 2.19–2.21, 4.2–4.4, 5.1–5.2, 6.1–6.2, 7.1–7.5 |

Rules:
- Branch from `main` at or after `4eecbbb`. The design's paths win over the folder names in `docs/team-assignments.md`.
- Shared contract: `src/lib/rules/types.ts` and the `programs.v2.json` schema. Change only with Lead approval.
- Until a dependency merges, build against a small feature-local stub that documents its assumptions. Never redefine shared types.
- Dictionaries: Teammate 1 may add only `intake.*`, `confirm.*`, `errors.*`, `facts.*`, `factOptions.*`, `value.*`, `confirmation.*` keys, in both `en.json` and `es.json`. Teammate 2 owns every other key.
- Docs in parallel: append rows only. New decision IDs by role: Lead D-1xx, Teammate 1 D-2xx, Teammate 2 D-3xx. Start each `docs/kiro-usage.md` Task cell with `[Lead]`, `[T1]`, or `[T2]`.
- Mark only your own tasks complete. Commit only your own paths.
- Lead merges `feature/core-action-graph` → `feature/intake-flow` → `feature/action-plan-handoff`, one at a time, running all checks after each.