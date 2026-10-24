# Demo scenarios

Fictional data only. Bridge does not submit anything to an agency.

## Judge demo: one story, one review, one plan

1. Open `/es/story` and select **Usar historia ficticia de demostración**, or read the fictional story aloud with **Hablar en vez de escribir** in a supported browser.
2. Point out the live **Lo que Bridge entendió** panel. The assistant extracts Massachusetts residence, Boston, job loss, renting, Notice to Quit, utility-account state, preferred language, and explicit uncertainty without deciding eligibility.
3. Select **Revisar lo que Bridge entendió**. Show that every field—including **No lo sé**—can be edited, then select the single **Todo está correcto — crear mi plan** action.
4. On the action plan, show RAFT first, SNAP second, and utility protection as **todavía no se sabe** because the shutoff-notice fact is unknown.
5. Open one **Cómo llegó Bridge a este resultado** disclosure to show the rule ID, five independent dimensions, missing fact, official Mass.gov source, and unsupported-deadline state.
6. Show the deduplicated evidence checklist, then open and print the bilingual handoff.

## Optional live-AI moment

With `OPENAI_API_KEY` configured, type a new fictional story in natural language. The status above the understood-facts panel changes from **Asistente de demostración confiable** to **Entrevista asistida por IA**. The same confirmation and deterministic rule pipeline follows; removing the key returns to the deterministic demo without changing the UI.

## Expected structured outcome

| Action | Status | Urgency | Source | Missing information |
|---|---|---|---|---|
| RAFT housing help | `may_match` | `urgent` | reviewed official Mass.gov page | none required by the simplified rule |
| SNAP food benefits | `may_match` | `standard` | reviewed official Mass.gov page | none required by the simplified rule |
| Utility shutoff protection | `cant_tell` | `unknown` | reviewed official Mass.gov page | `received_shutoff_notice` |

All three rules remain `synthetic: true`; the UI never calls this an eligibility determination. All deadlines remain `unknown(unsupported)`.

## Verification record — 2026-10-24

| Check | Result |
|---|---|
| TypeScript | `npm run typecheck` passed |
| ESLint | `npm run lint` passed |
| Unit and property tests | 27 files, 153 tests passed |
| Locale parity | 227 keys in English and Spanish; placeholders match |
| Provenance validator | 3 sources, 3 rules, 3 actions, 2 edges passed |
| Production build | passed; `/api/assistant` is server-rendered, locale pages are prerendered |
| Playwright | 68/68 passed across desktop Chromium and Pixel 7 emulation |
| Automated accessibility | 0 axe violations in the tested EN/ES routes; no horizontal scroll at 320px |
| Privacy in no-key demo | no cookies, localStorage, sessionStorage, or third-party requests |

Automated accessibility checks are not full WCAG conformance. A human Spanish-language review and manual screen-reader pass remain open.
