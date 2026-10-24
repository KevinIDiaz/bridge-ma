# Backlog

Not approved for the MVP. Moving an item into scope needs an `approved` entry in docs/decisions.md.

## Stretch
- Voice input
- Arbitrary document OCR
- Database
- User accounts
- Equity dashboard (aggregate only; must never affect individual matching)
- Offline mode
- Shared, expiring handoff packets
- Universal benefits coverage beyond SNAP, RAFT, and utility protection

## Parking lot
(New ideas raised during the build go here.)
- [Lead, 2026-10-24] Stage 4 P2 polish (finding F4 in demo-scenarios.md): handoff fact labels render as "?:"; `received_shutoff_notice` shows under both confirmed answers and answers still needed (D-102); "Demo rule" label repeats on every document row. Not demo-blocking.
- [Lead, 2026-10-24] Stage 4 P2 (Teammate 1 audit): move `src/components/steps/stubJourney.ts` under `tests/` since only unit tests use it.
