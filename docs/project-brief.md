# Project brief: Bridge MA

Hackachusetts Civic Action project. Three-developer team (see docs/team-assignments.md). Code complete by 6:00 PM ET, 2026-10-24. Submission: public GitHub repo and a video demo; no deployment (D-108).

## Problem
A Massachusetts resident in crisis faces several programs with separate rules, documents, and portals. Bridge MA turns their story into a sourced, ordered set of next steps.

## Scope (vertical slice)
Programs: SNAP, RAFT, utility shutoff protection. Nothing else.

Demo persona (fictional): Spanish-speaking single parent in Boston, recently lost a job, received a fictional Notice to Quit.

Journey:
1. Tell Bridge the story in natural language or optional voice input
2. Review and edit what Bridge understood, then confirm once
3. Follow three prioritized actions with integrated reusable documents, human/official handoff, and printable EN/ES summary

## Every action card shows
- Why it appeared
- Matching status (may match / likely does not match / can't tell yet)
- Missing facts
- Official source and review status
- Deterministic result vs. generated explanation, labeled
- Next action
- Required / reusable evidence
- Deadline, only when safely supported
- Official portal or human handoff

## Boundaries
- No eligibility guarantees, no legal conclusions, no agency impersonation, no application submission.
- Unknown ≠ false. Extracted facts need user confirmation.
- Models extract proposed facts or explain only; deterministic code decides matching, calculations, and action order.
- Neighborhood data never affects individual matching.
- Unverified policy claims never appear as authoritative.
- Fictional data only. No auth, persistence, analytics, or database.

## Success criteria
- The three-step primary journey works end to end in English and Spanish on a local production build (`npm run build`, `npm start`), recorded in the video demo.
- The app runs fully with no model API key (deterministic fallback).
- Property tests for the boundaries above pass.

## Status
The Action Graph spec and conversational-intake spec live under `.kiro/specs/`. The deterministic domain contract remains unchanged by the conversational redesign.
