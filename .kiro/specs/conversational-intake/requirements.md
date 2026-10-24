# Conversational Intake and Simplified Action Plan Requirements

## Intent

Bridge MA must feel like a supportive navigator, not an agency questionnaire. A resident should be able to describe one hard moment in their own words, review what Bridge heard once, and receive a local Massachusetts action plan without the model ever deciding eligibility.

## Requirements

### 1. Natural-language intake

1.1 WHEN a resident opens the story step, THE SYSTEM SHALL invite a plain-language description without requiring knowledge of agency or program names.

1.2 WHEN a resident submits a message in English or Spanish, THE SYSTEM SHALL return a plain-language acknowledgement, zero or more proposed allowlisted facts, and at most one follow-up question.

1.3 WHEN voice recognition is available in the browser, THE SYSTEM SHALL permit speech-to-text input while retaining the text area as the complete alternative.

### 2. Structured and bounded model output

2.1 THE SYSTEM SHALL accept proposed facts only for IDs defined by the versioned fixture.

2.2 THE SYSTEM SHALL validate fact types, choice values, number ranges, response length, and confidence values after every provider response.

2.3 IF output is malformed, times out, is refused, or includes an unknown fact, THEN THE SYSTEM SHALL reject the invalid content and use the deterministic fallback.

2.4 THE MODEL SHALL NOT decide MatchStatus, urgency, action order, evidence requirements, deadlines, or eligibility.

### 3. Review and consent

3.1 WHEN facts are proposed, THE SYSTEM SHALL show a live “What Bridge understood” summary.

3.2 BEFORE evaluation, THE SYSTEM SHALL show every fixture fact with explicit values including `unknown`, allow individual edits, and require one resident confirmation action.

3.3 THE SYSTEM SHALL keep all extracted facts `unconfirmed` until the resident performs that confirmation action.

### 4. Reliable demo operation

4.1 IF `OPENAI_API_KEY` is absent, THEN THE SYSTEM SHALL complete the same three-step journey using a deterministic bilingual extractor.

4.2 IF a live provider fails, THEN THE SYSTEM SHALL return a deterministic result without exposing provider errors or losing the resident's message.

4.3 THE SYSTEM SHALL clearly distinguish “AI-assisted intake” from “Reliable demo assistant” without changing outcomes.

### 5. Accessible, progressive presentation

5.1 THE SYSTEM SHALL provide one primary action per screen, keyboard operation, visible focus, text status labels, mobile layout without horizontal scrolling, and reduced-motion support.

5.2 THE SYSTEM SHALL keep the action card's “why,” next action, and human/official handoff visible by default.

5.3 THE SYSTEM SHALL place rule IDs, dimensions, deadline state, evidence provenance, and source metadata under an operable disclosure titled “How Bridge reached this result.”

5.4 THE SYSTEM SHALL integrate the deduplicated evidence checklist and direct bilingual printable handoff into the action-plan screen.

### 6. Massachusetts provenance and privacy

6.1 THE SYSTEM SHALL link only reviewed official source URLs and SHALL keep synthetic matching rules visibly labeled as simplified demo rules.

6.2 THE SYSTEM SHALL warn residents to use fictional data and not enter names, exact addresses, Social Security numbers, account numbers, or medical records.

6.3 THE SYSTEM SHALL store no intake data in cookies, localStorage, sessionStorage, a database, or analytics.

6.4 THE SYSTEM SHALL send a submitted story only to the same-origin assistant endpoint; only the server may call the configured provider.

