# Project brief: Bridge MA

Hackachusetts Civic Action project. Solo developer. Deployed MVP due 6:00 PM ET, 2026-10-24.

## Problem
A Massachusetts resident in crisis faces several programs with separate rules, documents, and portals. Bridge MA turns their story into a sourced, ordered set of next steps.

## Scope (vertical slice)
Programs: SNAP, RAFT, utility shutoff protection. Nothing else.

Demo persona (fictional): Spanish-speaking single parent in Boston, recently lost a job, received a fictional Notice to Quit.

Journey:
1. Tell your story
2. Confirm facts
3. View three next actions
4. See reusable documents
5. Understand uncertainty / human help
6. Print bilingual (EN/ES) handoff

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
- Models normalize or explain only; deterministic code decides matching and calculations.
- Neighborhood data never affects individual matching.
- Unverified policy claims never appear as authoritative.
- Fictional data only. No auth, persistence, analytics, or database.

## Success criteria
- The six-step journey works end to end in English and Spanish on a public deployment.
- The app runs fully with no model API key (deterministic fallback).
- Property tests for the boundaries above pass.
