---
inclusion: fileMatch
fileMatchPattern: ["package.json", "tsconfig*.json", "next.config.*", "src/**/*.ts", "src/**/*.tsx"]
---
# Tech

- Next.js (App Router), TypeScript strict, npm. Pin dependency versions exactly.
- Data: local versioned JSON fixtures (each file has `version` and `sources[]`). No database, no persistence.
- i18n: `en` and `es` dictionaries; every user-facing string comes from a dictionary.
- Rules engine: pure deterministic TypeScript functions. Input = confirmed facts + fixtures; output = status, missing facts, rule IDs.
- Model adapter: provider-independent interface (`normalize`, `explain`). Default is a deterministic demo fallback; app must fully work with no API key. Model output never feeds back into matching.
- Server-only secrets via env vars; never expose to client bundles.
- Tests: Vitest (unit), fast-check (property), Playwright (journey e2e).
