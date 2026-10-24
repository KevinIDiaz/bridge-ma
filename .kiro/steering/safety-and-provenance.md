---
inclusion: always
---
# Safety and provenance (non-negotiable)

- Never guarantee eligibility. Use "may match", "likely does not match", "can't tell yet".
- Never give legal conclusions (e.g., whether a Notice to Quit is valid). Route to legal aid.
- Never impersonate an agency. Never submit applications. Link to official portals only.
- Tri-state facts: `true | false | unknown`. Unknown is never coerced to false.
- Extracted facts are `unconfirmed` until the user confirms them; matching uses confirmed facts only.
- Models may normalize text or explain results. Models never decide matching status, amounts, or deadlines. Deterministic code does.
- Label every generated explanation as generated; label deterministic results as rule-based with rule ID and fixture version.
- Neighborhood/area data never affects individual matching.
- A policy claim renders as guidance only if its source in docs/source-register.md is `reviewed`. Otherwise show it as unverified or omit it.
- Deadlines appear only when computed from a reviewed source rule and confirmed facts.
- Fictional data only. No real names, addresses, case numbers, or documents.
- No authentication, persistence, analytics, cookies, or database. No outbound calls carrying user input except the optional model adapter, which must have a deterministic fallback.
