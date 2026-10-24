---
inclusion: auto
name: structure
description: Planned Bridge MA folder layout and naming. Use when creating, moving, or organizing source, fixture, test, or docs files.
---
# Structure (provisional until scaffold)

```
src/app/            Next.js routes for the six journey steps
src/components/     UI components (ActionCard, FactConfirm, Handoff)
src/lib/rules/      deterministic matching + calculations (no I/O)
src/lib/model/      model adapter interface + demo fallback
src/lib/i18n/       en.json, es.json, lookup helper
src/fixtures/       versioned JSON: programs, rules, sources, demo persona
tests/unit/         Vitest + fast-check
tests/e2e/          Playwright journey tests
docs/               brief, decisions, backlog, registers, Kiro usage
```

- One rule module per program: `snap`, `raft`, `utility`.
- Fixture files named `<topic>.v<N>.json`.
