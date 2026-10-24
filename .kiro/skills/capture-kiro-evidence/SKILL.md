---
name: capture-kiro-evidence
description: Record factual evidence of how Kiro features were used in docs/kiro-usage.md, based on the actual diff, specs, tool calls, and test output. Use after a task, before a commit, or when asked to log Kiro usage.
---
# Capture Kiro evidence

## Inspect first
- `git diff` / `git log -1 --stat` for what changed.
- Specs under `.kiro/specs/`, steering, hooks, skills, agents, MCP config touched.
- Tool calls made this session (commands, MCP calls, sub-agents) and their real output.
- Test output (counts, failures, exit codes).

## Write one row per real event
Append to the table in `docs/kiro-usage.md`:
`| Date | Task | Kiro feature | Observed result | Change | Verification | Artifact / commit | Limitation |`

## Rules
- Configured is not used. A server in mcp.json, a hook file, or a skill file is "configured" until a tool call, firing, or activation was observed.
- Deliberate fault injection (a planted bug or probe file) must be labeled as such. Only call something a "discovered bug" if it was found without planting it, and say which tool found it (test, PBT, hook, MCP, manual).
- Copy numbers from output; never estimate time saved, coverage, or productivity.
- If something could not be verified, say so in the Limitation column.
- Never invent results. If there is nothing new, add nothing and say so.
