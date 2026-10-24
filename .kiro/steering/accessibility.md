---
inclusion: fileMatch
fileMatchPattern: ["src/**/*.tsx", "src/**/*.css", "src/lib/i18n/**"]
---
# Accessibility

- Target WCAG 2.2 AA. Automated checks are not full validation; manual screen-reader testing is still required.
- Semantic HTML first: landmarks, one `h1` per page, ordered headings, real `<button>`/`<a>`.
- Every input has a visible `<label>`. Errors are text, linked via `aria-describedby`.
- Status (may match / unknown / likely not) is conveyed by text, not color alone.
- Keyboard: full journey operable without a mouse; visible focus; logical order.
- Set `lang` on `<html>` and on any mixed-language block in the bilingual handoff.
- Plain language (aim ~6th–8th grade) in both English and Spanish.
- Print stylesheet for the handoff: readable without color, no clipped content.
