# MCP register

MCP servers used for this project. Never record credentials or env values here.

Config: `.kiro/settings/mcp.json` (workspace; no secrets). Kiro permissions block agent writes to `.kiro/settings/`, so the developer edits that file. User-level config was not inspected.

## Approved servers

| Server | Purpose | Data sent off-machine | Config | Verified use (2026-10-24) | Status |
|--------|---------|-----------------------|--------|---------------------------|--------|
| playwright (`@playwright/mcp`) | Drive a local browser in development: check pages, try the journey | None by itself; runs locally. Pages it opens are fetched from their hosts | `npx -y @playwright/mcp@latest` (pin to `@0.0.83` pending, see below) | Opened `http://localhost:3000/` (redirected to `/en`), clicked Start, reached `/en/story` with h1 "Tell your story", `lang=en`. Repeated on `/es` → `/es/story` "Cuente su historia". Found a `favicon.ico` 404 console error, fixed by adding `src/app/icon.svg` | working, version observed: 0.0.83 |
| context7 (`https://mcp.context7.com/mcp`) | Current library docs | Library names and doc queries go to Context7 (third party). Never send project code, fixtures, or demo data | remote URL, no API key | `resolve-library-id` "Next.js" → `/vercel/next.js`; `query-docs` on `/vercel/next.js/v16.2.9` for `dynamicParams` / `generateStaticParams` / async `params` | working. No 16.4.x index exists; newest indexed version is v16.2.9, so docs may lag the installed 16.4.3 |

Pending action: change Playwright's args to `["-y", "@playwright/mcp@0.0.83"]` in `.kiro/settings/mcp.json`. The agent's edit was blocked by Kiro permissions.

Rules:
- Neither server is a policy source. Program claims still need an official page reviewed in docs/source-register.md.
- Keep `autoApprove` empty, so every tool call asks first.
- Playwright MCP writes session files to `.playwright-mcp/` (gitignored).

## Proposed servers (teammates)

Add a row here first. A server is not added to `mcp.json` until a decision in docs/decisions.md approves it.

| Proposed by | Server | Purpose | Data sent off-machine | Credentials needed | Decision ID | Status |
|-------------|--------|---------|-----------------------|--------------------|-------------|--------|
| — | — | — | — | — | — | none proposed |
