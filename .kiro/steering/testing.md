---
inclusion: fileMatch
fileMatchPattern: ["tests/**", "**/*.test.ts", "**/*.test.tsx", "vitest.config.*", "playwright.config.*", "src/lib/rules/**"]
---
# Testing

- Vitest unit tests for every rule module and calculation.
- fast-check properties (required):
  - `unknown` facts never produce a definitive "matches" or "does not match".
  - Unconfirmed facts never change matching output.
  - Neighborhood data never changes matching output.
  - Model adapter output never changes matching output.
  - No deadline is emitted without a reviewed source.
- Playwright: one e2e test for the full six-step journey in EN and ES, including print view.
- Tests use fictional fixtures only.
- Run with `npx vitest --run` and `npx playwright test` (no watch mode).
