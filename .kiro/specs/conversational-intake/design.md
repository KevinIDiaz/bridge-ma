# Conversational Intake Design

## Architecture

```text
Resident story / optional browser speech-to-text
                    |
                    v
          POST /api/assistant
                    |
          +---------+---------+
          |                   |
  OpenAI Responses API   deterministic bilingual
  Structured Outputs    fallback extractor
          |                   |
          +---------+---------+
                    |
       local allowlist/type validation
                    |
                    v
   proposed facts (always unconfirmed)
                    |
          one resident review action
                    |
                    v
     deterministic evaluateBridge pipeline
                    |
                    v
 action cards + reused evidence + bilingual handoff
```

## Components

- `src/components/steps/IntakeStep.tsx`: conversation, optional speech recognition, live fact summary, and review transition.
- `src/app/api/assistant/route.ts`: same-origin JSON endpoint; reads server-only environment variables and returns no-store responses.
- `src/lib/assistant/openai.ts`: Responses API request with strict JSON Schema Structured Outputs, eight-second abort, `store: false`, and no client secret exposure.
- `src/lib/assistant/validation.ts`: authoritative fact allowlist and type/range validation for both request and provider output.
- `src/lib/assistant/fallback.ts`: deterministic English/Spanish extraction and one-question sequencing for the demo persona.
- `src/components/steps/ConfirmStep.tsx`: complete structured review with individual edits and one “build my plan” confirmation.
- `src/lib/rules/**`: unchanged decision boundary; it receives only resident-confirmed facts.
- `src/components/ActionCard.tsx`: progressive disclosure that keeps the resident task visible and audit detail available.

## Safety boundary

The model is a parser and communication layer. It cannot import or invoke the rule engine, mutate the fixture, create a source, or return an action outcome. The server validates every field again even though Structured Outputs is enabled. The client fills every absent fixture fact as explicit `unknown`; it never guesses.

## Failure behavior

- Missing API key: deterministic fallback.
- Provider timeout, HTTP error, refusal, invalid JSON, or invalid local validation: deterministic fallback.
- Same-origin route failure: message remains in the composer and the UI announces a retryable error.
- Unknown/missing fact: visible as `unknown`, not `false`.

## Accessibility

The conversation is a semantic ordered list with an `aria-live` addition region. All controls are native elements with visible labels and at least 44px targets. Confirmation provides structured edit controls as a non-conversational alternative. The action plan is readable before any disclosure is opened.

