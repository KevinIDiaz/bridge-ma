---
inclusion: always
---
# Solo workflow

- Three developers in parallel (roles and paths in team.md), hard deadline: code complete by 6:00 PM ET. Submission is the public GitHub repo plus a video demo of a local production build; no deployment (D-108). Prefer the smallest change that completes the journey.
- Do not add features outside product.md. New ideas go to docs/backlog.md.
- Record decisions in docs/decisions.md as `provisional` or `approved`. Only a developer approves; shared-contract decisions need the Lead.
- Log real Kiro usage in docs/kiro-usage.md. Never invent usage, bugs, metrics, or time savings.
- Small commits with clear messages; commit only when the developer asks.
- Never print credentials or env values. Never create nested Git repos.

## Doc upkeep (end of every turn that changed something)
- New or changed choice → docs/decisions.md (next D-ID; Kiro-proposed = `provisional`)
- Used a Kiro feature with an observable result → docs/kiro-usage.md row
- Out-of-scope idea → docs/backlog.md parking lot
- Official URL opened or claim checked → docs/source-register.md
- MCP server added/removed → docs/mcp-register.md
- Scope, stack, or status changed → README.md / docs/project-brief.md
- In the final reply, list which docs were updated, or say "no doc updates needed".
