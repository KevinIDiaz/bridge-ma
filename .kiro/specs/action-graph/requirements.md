# Requirements Document

## Introduction

The Action Graph feature delivers the Bridge MA six-step journey for one fictional resident: Tell your story → Confirm facts → View three next actions → See reusable documents → Understand uncertainty / human help → Print bilingual handoff. It covers exactly three programs: SNAP, RAFT, and utility shutoff protection.

The demo persona is fictional: a Spanish-speaking Boston single parent who recently lost a job and received a fictional Notice to Quit.

All entries in `docs/source-register.md` are currently `unreviewed`. Every rule in this feature is therefore synthetic. The system shows it as unverified and never as an official conclusion. This document states no dollar amounts, day counts, income limits, or date ranges as policy. Claims in `docs/bridge-build-playbook.md` are reference only and are not requirements.

Domain logic (fact handling, rule evaluation, graph building, validation, deadlines) runs as pure TypeScript with no React, Next.js, or model-provider dependency. The app works fully with no model API key.

### Out of scope

Voice input, OCR, document upload, database, accounts, authentication, persistence, cookies, analytics, application submission, equity dashboard, shared or expiring packets, and any program other than SNAP, RAFT, and utility shutoff protection.

## Glossary

- **Bridge_MA**: The web application as a whole.
- **Intake_Form**: Step 1 UI where the resident enters fictional facts manually.
- **Fact_Review**: Step 2 UI where the resident confirms, corrects, or marks facts as unknown.
- **Rules_Engine**: Pure deterministic module that evaluates programs from confirmed facts and fixtures.
- **Graph_Builder**: Pure deterministic module that turns ProgramEvaluations into ActionNodes and ActionEdges.
- **Graph_Validator**: Pure deterministic module that checks an action graph for structural errors.
- **Deadline_Calculator**: Pure deterministic module that produces a Deadline for an ActionNode.
- **Fixture_Loader**: The existing validating loader in `src/lib/data/` for versioned JSON fixtures.
- **Localizer**: Module that renders structured outcomes as English or Spanish text from dictionaries.
- **Model_Adapter**: The existing provider-independent adapter (`normalize`, `explain`) with the deterministic demo fallback.
- **Action_Card**: Step 3 UI element that displays one ActionNode.
- **Evidence_View**: Step 4 UI listing EvidenceRequirements across actions.
- **Help_View**: Step 5 UI explaining uncertainty and human help options.
- **Handoff_View**: Step 6 printable page rendering the HandoffPacket in English and Spanish.
- **Session_State**: In-memory browser state for the current tab only. It is lost on reload.
- **TriState**: A value of `true`, `false`, or `unknown`. `unknown` is distinct from `false`.
- **ResidentFact**: One fact about the resident. Fields: fact ID, TriState value (or a typed value such as household size, or `unknown`), confirmation (`unconfirmed` or `confirmed`), and origin (`user`). The demo includes an optional `neighborhood` fact that is area context only.
- **Source**: A fixture record mirroring a row of `docs/source-register.md`. Fields: source ID, program ID, publisher, title, URL (nullable), retrieved date (nullable), review status.
- **RuleVersion**: A fixture record for one program rule. Fields: rule ID, version, program ID, source IDs, required fact IDs, and a `synthetic` flag. `synthetic` is `true` whenever any cited Source is not `reviewed`.
- **EvidenceType**: A kind of document (for example, proof of identity, proof of income loss, the Notice to Quit, a utility bill). Each has an ID and dictionary labels.
- **EvidenceRequirement**: A link between an ActionNode and an EvidenceType. Fields: EvidenceType ID, `required` or `helpful`, and the list of ActionNode IDs that reuse it.
- **ProgramEvaluation**: Rules_Engine output for one program. Fields: program ID, MatchStatus, rule ID, rule version, fixture version, predicate results, missing fact IDs, unconfirmed fact IDs, source IDs.
- **ActionNode**: One recommended next action. Fields: action ID, program ID, ProgramEvaluation reference, Urgency, SourceFreshness, FactConfirmation, ExplanationOrigin, next-step key, EvidenceRequirements, Deadline, and a Handoff_Target.
- **ActionEdge**: A directed "do before" link between two ActionNodes. Fields: from action ID, to action ID, reason key.
- **Action_Graph**: The set of ActionNodes and ActionEdges for one session.
- **Deadline**: Either `{ kind: "computed", date, ruleId, sourceId }` or `{ kind: "unknown", reason }`. Reason is one of `source_unreviewed`, `facts_unconfirmed`, `unsupported`.
- **HandoffPacket**: Structured summary for printing. Fields: confirmed facts, unknown facts, ActionNodes, EvidenceRequirements, Handoff_Targets, fixture version, rule versions, generated-at date.
- **Handoff_Target**: Either an official portal link (only from a `reviewed` Source URL) or a human help option (legal aid, program office, or a general help line referenced by name only).
- **MatchStatus**: `may_match`, `likely_not`, or `cant_tell`. Displayed as "may match", "likely does not match", "can't tell yet" (provisional D-010).
- **Urgency**: `urgent`, `standard`, or `unknown`. Derived only from confirmed facts by fixed synthetic rules (for example, a confirmed Notice to Quit or shutoff notice). Urgency carries no day counts.
- **SourceFreshness**: The Source review status: `reviewed`, `unreviewed`, or `stale`.
- **FactConfirmation**: `all_confirmed`, `has_unconfirmed`, or `has_missing`, describing the facts an ActionNode's rule requires.
- **ExplanationOrigin**: `generated` only for text returned by a configured model provider through the Model_Adapter, labeled "Generated explanation". `rule_based` for dictionary templates selected by rule ID and for the deterministic demo fallback, labeled "Rule-based explanation (template)".
- **Recommendation_Dimensions**: MatchStatus, Urgency, SourceFreshness, FactConfirmation, and ExplanationOrigin, held as five independent fields.

## Requirements

### Requirement 1: Manual fictional intake

**User Story:** As a demo resident, I want to type or select my situation, so that Bridge MA can suggest next steps without uploads or voice.

#### Acceptance Criteria

1. THE Intake_Form SHALL collect each fact through exactly one visibly labeled input of one of three kinds: a text input that accepts at most 200 characters, a number input that accepts whole numbers only, or a single-choice input (radio group or select). THE Intake_Form SHALL contain no file upload, camera, microphone, or voice input control.
2. THE Intake_Form SHALL offer an "I don't know" choice (and its Spanish equivalent) for every fact. That choice SHALL be separate from any "No" or `false` choice.
3. WHEN the resident submits the Intake_Form and every entered value passes validation, THE Bridge_MA SHALL store one ResidentFact per Intake_Form fact. Each ResidentFact SHALL have confirmation `unconfirmed` and origin `user`. THE Bridge_MA SHALL then show the Fact_Review.
4. WHEN the resident activates the "Use fictional demo story" control, THE Intake_Form SHALL fill every input with the fictional demo persona values: Spanish language preference, Boston, single parent, recent job loss, and a received Notice to Quit. THE Intake_Form SHALL NOT submit the form. Every filled input SHALL stay editable, and the filled values SHALL contain no real names, addresses, case numbers, or document identifiers.
5. THE Intake_Form SHALL display, in the current locale, a notice that only fictional information may be entered. The notice SHALL be placed above the first input and SHALL be visible without any user interaction.
6. THE Bridge_MA SHALL hold ResidentFacts in Session_State only. THE Bridge_MA SHALL write no ResidentFact to cookies, browser storage, or any server, and every ResidentFact SHALL be cleared when the tab is reloaded.
7. IF an entered value fails validation (a text value over 200 characters, a number value that is not a whole number, or a household size outside 1 to 20), THEN THE Intake_Form SHALL show a text error message next to that input stating the expected format, link the message to the input by `aria-describedby`, move focus to the first invalid input, keep every other entered value unchanged, and store no ResidentFact for that submission.
8. WHEN the resident submits the Intake_Form with a fact left blank or set to "I don't know", THE Bridge_MA SHALL store that ResidentFact with the value `unknown` and SHALL NOT store it as `false`.

### Requirement 2: Explicit fact confirmation

**User Story:** As a demo resident, I want to review and confirm each fact, so that results use only what I have checked.

#### Acceptance Criteria

1. WHEN the resident opens the Fact_Review, THE Fact_Review SHALL list every ResidentFact in Session_State. Each row SHALL show the fact name, the current value, and the confirmation state as text from the `en` or `es` dictionary.
2. WHEN the resident activates the confirm control for one ResidentFact, THE Fact_Review SHALL set only that ResidentFact's confirmation to `confirmed`. The ResidentFact's value SHALL stay the same, and a value of `unknown` SHALL stay `unknown`.
3. WHEN the resident saves a changed value for a ResidentFact, THE Fact_Review SHALL store the new value and set that ResidentFact's confirmation to `unconfirmed`, whatever its previous confirmation state. A change to `unknown` counts as a changed value.
4. THE Fact_Review SHALL show the TriState values `true`, `false`, and `unknown` with three different text labels. THE Fact_Review SHALL NOT show an `unknown` value as a blank, as `false`, or with the `false` label.
5. THE Rules_Engine SHALL read only ResidentFacts whose confirmation is `confirmed`.
6. THE Rules_Engine SHALL evaluate any predicate reading an unconfirmed ResidentFact as `unknown` and SHALL list that fact ID in the ProgramEvaluation's unconfirmed fact IDs (not its missing fact IDs).
7. IF a changed value fails validation in the Fact_Review, THEN THE Fact_Review SHALL show a text error next to the input, linked to the input by `aria-describedby`. That ResidentFact's previous value and confirmation state SHALL stay unchanged, and no other ResidentFact SHALL change.
8. WHILE one or more ResidentFacts are `unconfirmed`, THE Fact_Review SHALL show, in text, how many facts are unconfirmed and that unconfirmed facts are not used for matching.
9. WHEN the Fact_Review lists the `neighborhood` ResidentFact, THE Fact_Review SHALL label the `neighborhood` ResidentFact in text as area context that does not affect matching.

### Requirement 3: Deterministic program evaluation

**User Story:** As a demo resident, I want a consistent, rule-based status for SNAP, RAFT, and utility protection, so that I can see which programs may fit.

#### Acceptance Criteria

1. WHEN the Rules_Engine is invoked, THE Rules_Engine SHALL return exactly three ProgramEvaluations, one each for program IDs `snap`, `raft`, and `utility`, in that fixed order, with no duplicate or additional program IDs.
2. THE Rules_Engine SHALL take as input only: the values of ResidentFacts whose confirmation is `confirmed`, the IDs (without values) of ResidentFacts whose confirmation is `unconfirmed`, the RuleVersions, and the program fixture loaded by the Fixture_Loader.
3. THE Rules_Engine SHALL evaluate each required predicate of a RuleVersion to exactly one TriState result (`true`, `false`, or `unknown`). A predicate SHALL yield `unknown` when any fact the predicate reads is `unknown`, unconfirmed, or has no ResidentFact, and SHALL yield `false` in none of those three cases.
4. WHEN at least one required predicate of a RuleVersion evaluates to `false`, THE Rules_Engine SHALL set MatchStatus to `likely_not`, regardless of how many other required predicates are `true` or `unknown`.
5. WHEN no required predicate evaluates to `false` and at least one evaluates to `unknown`, THE Rules_Engine SHALL set MatchStatus to `cant_tell`.
6. WHEN every required predicate evaluates to `true` and the RuleVersion has one or more required predicates, THE Rules_Engine SHALL set MatchStatus to `may_match`.
7. THE Rules_Engine SHALL record each required fact ID of a RuleVersion in exactly one of three places: missing fact IDs (no ResidentFact exists, or the confirmed value is `unknown`), unconfirmed fact IDs (a ResidentFact exists with confirmation `unconfirmed`), or neither (a confirmed, non-`unknown` value exists).
8. THE Rules_Engine SHALL record in each ProgramEvaluation the rule ID, rule version, fixture version, source IDs of the RuleVersion applied, and one predicate result per required predicate.
9. THE Rules_Engine SHALL exclude the `neighborhood` fact and any area data from predicate inputs, so that adding, removing, or changing the `neighborhood` fact or area data leaves every ProgramEvaluation unchanged.
10. THE Rules_Engine, Graph_Builder, Graph_Validator, and Deadline_Calculator SHALL run without importing React, Next.js, or the Model_Adapter.
11. WHEN the Rules_Engine is invoked twice with identical inputs, THE Rules_Engine SHALL return identical ProgramEvaluations, using no clock, random value, network call, or Model_Adapter output.
12. IF the program fixture has no RuleVersion, or more than one RuleVersion, for `snap`, `raft`, or `utility`, or a RuleVersion has zero required predicates, THEN THE Rules_Engine SHALL return an error naming the affected program ID and SHALL return no ProgramEvaluations.

### Requirement 4: Synthetic rules and source provenance

**User Story:** As a demo resident, I want to see where each rule comes from and whether it has been checked, so that I do not mistake a demo rule for official policy.

#### Acceptance Criteria

1. IF a RuleVersion cites a source ID that is not present in the fixture's Source records, THEN THE Fixture_Loader SHALL reject the whole fixture and return an error naming the rule ID and the missing source ID. THE Fixture_Loader SHALL pass no already-parsed fixture data to the Rules_Engine.
2. IF a RuleVersion has `synthetic` set to `false` and at least one cited Source has a review status of `unreviewed` or `stale`, THEN THE Fixture_Loader SHALL reject the whole fixture and return an error naming the rule ID and each cited source ID that is not `reviewed`.
3. IF the Fixture_Loader rejects the fixture, THEN THE Bridge_MA SHALL show no Action_Cards and no partial ProgramEvaluations, and SHALL show in their place a text message in the current locale that sends the resident to human help.
4. WHILE the RuleVersion an ActionNode is based on has `synthetic` set to `true`, THE Action_Card SHALL show the text label "Demo rule, not verified against official policy" from the current locale's dictionary (`en` or `es`). The label SHALL appear on that Action_Card at every viewport width of 320 CSS pixels or more.
5. THE Action_Card SHALL show, in text, the publisher, title, and SourceFreshness value (`reviewed`, `unreviewed`, or `stale`) for every Source the RuleVersion cites, one entry per cited source ID, with no Source left out.
6. WHILE a Source has a review status of `unreviewed` or `stale`, THE Bridge_MA SHALL show an "Unverified" text label from the current locale's dictionary next to every claim citing that Source in the Action_Card, Help_View, and Handoff_View, and SHALL NOT render that claim as official guidance or as a Handoff_Target official portal link.
7. THE program fixture SHALL contain zero dollar amounts, day counts, income limits, or date ranges in any RuleVersion or Source record whose cited Source has a review status other than `reviewed`. An automated fixture test SHALL check this rule and fail if any such value is present.

### Requirement 5: Action graph construction and validation

**User Story:** As a demo resident, I want my next steps in a clear order, so that I know what to do first.

#### Acceptance Criteria

1. WHEN the Rules_Engine has produced ProgramEvaluations for `snap`, `raft`, and `utility`, THE Graph_Builder SHALL produce exactly three ActionNodes, one per program, each with a distinct action ID, for every MatchStatus, including `likely_not` and `cant_tell`.
2. THE Graph_Builder SHALL order ActionNodes first by Urgency (`urgent`, then `standard`, then `unknown`) and break ties with the fixed program order `raft`, `utility`, `snap`. No other field SHALL affect the order.
3. THE Graph_Builder SHALL set, in each ActionNode, a ProgramEvaluation reference, a rule ID, and one or more source IDs, each matching a ProgramEvaluation, RuleVersion, and Source present in the Graph_Builder's inputs.
4. IF a ProgramEvaluation, RuleVersion, or Source needed by an ActionNode is absent from the inputs, THEN THE Graph_Builder SHALL return an error naming the missing ID and SHALL return no Action_Graph.
5. WHEN the Graph_Builder produces an ActionEdge, THE Graph_Builder SHALL use two distinct action IDs present in the Action_Graph, with the "from" ActionNode placed before the "to" ActionNode in the order from criterion 2.
6. IF an Action_Graph contains two or more ActionNodes with the same action ID, THEN THE Graph_Validator SHALL return exactly one `duplicate_id` error per repeated ID, naming that ID.
7. IF an ActionEdge's "from" or "to" action ID is absent from the Action_Graph's ActionNodes, THEN THE Graph_Validator SHALL return one `dangling_edge` error for that ActionEdge, naming its "from" ID, its "to" ID, and which of the two is absent.
8. IF the ActionEdges contain a directed cycle of two or more ActionNodes, THEN THE Graph_Validator SHALL return a `cycle` error listing the action IDs of that cycle in edge-traversal order.
9. IF an ActionEdge has the same "from" and "to" action ID (a self-loop), THEN THE Graph_Validator SHALL return a `cycle` error listing that single action ID.
10. WHEN the Graph_Validator checks an Action_Graph, THE Graph_Validator SHALL return every applicable `duplicate_id`, `dangling_edge`, and `cycle` error in one result, without stopping at the first error.
11. WHEN the Graph_Validator checks an Action_Graph that has no repeated action IDs, no dangling edges, and no cycles (including zero ActionEdges), THE Graph_Validator SHALL return an empty error list.
12. IF the Graph_Builder returns an error or the Graph_Validator returns one or more errors, THEN THE Bridge_MA SHALL render no Action_Cards and SHALL show a text message directing the resident to human help, leaving all ResidentFacts unchanged in Session_State.

### Requirement 6: Recommendation dimensions kept separate

**User Story:** As a demo resident, I want each card to show status, urgency, source freshness, fact confirmation, and explanation origin separately, so that one signal never hides another.

#### Acceptance Criteria

1. THE Graph_Builder SHALL store MatchStatus, Urgency, SourceFreshness, FactConfirmation, and ExplanationOrigin as five independent fields on each ActionNode. MatchStatus SHALL be copied unchanged from the referenced ProgramEvaluation. A change to the input of one dimension SHALL leave the other four fields unchanged (for example, changing a Source review status changes only SourceFreshness; changing ExplanationOrigin changes no other field).
2. WHEN the Graph_Builder builds an ActionNode, THE Graph_Builder SHALL derive Urgency from the RuleVersion's fixed synthetic urgency rule over confirmed ResidentFacts only: `urgent` when the urgency trigger fact (for example, Notice to Quit or shutoff notice) is confirmed `true`; `standard` when the trigger fact is confirmed `false` or the RuleVersion defines no urgency trigger; `unknown` when the trigger fact is missing, `unknown`, or unconfirmed. Urgency SHALL contain no day count, date, or duration.
3. IF the referenced ProgramEvaluation lists one or more missing fact IDs, THEN THE Graph_Builder SHALL set FactConfirmation to `has_missing`, whether or not any other required fact is also unconfirmed.
4. IF the referenced ProgramEvaluation lists zero missing fact IDs and one or more unconfirmed fact IDs, THEN THE Graph_Builder SHALL set FactConfirmation to `has_unconfirmed`.
5. THE Action_Card SHALL display each of the five Recommendation_Dimensions as its own text label showing the dimension name and value in the active locale. No label SHALL combine two dimensions, and no dimension SHALL be shown through color or icon alone.
6. IF the referenced ProgramEvaluation lists zero missing fact IDs and zero unconfirmed fact IDs, THEN THE Graph_Builder SHALL set FactConfirmation to `all_confirmed`.
7. WHEN the Graph_Builder builds an ActionNode, THE Graph_Builder SHALL set SourceFreshness from every Source cited by the RuleVersion: `stale` if any is `stale`; otherwise `unreviewed` if any is `unreviewed`; otherwise `reviewed`.
8. WHEN an explanation is attached to an ActionNode, THE Bridge_MA SHALL set ExplanationOrigin to `generated` only when the text is output from a configured model provider, and to `rule_based` when the text is the dictionary template for the rule ID or the deterministic demo fallback.

### Requirement 7: Three actionable recommendation cards

**User Story:** As a demo resident, I want three cards that tell me what to do next, so that I can act without reading program rules.

#### Acceptance Criteria

1. WHEN the Graph_Validator returns no errors for the Action_Graph, THE Bridge_MA SHALL render exactly three Action_Cards, one per ActionNode, in Action_Graph order.
2. THE Action_Card SHALL show why the action appeared as one rule-based reason from the `en` or `es` dictionary, chosen by the ActionNode's rule ID and MatchStatus, containing no Model_Adapter output.
3. THE Action_Card SHALL list, by dictionary label, each missing fact under a "Missing" heading and each unconfirmed fact under a separate "Not yet confirmed" heading, using the ProgramEvaluation's missing and unconfirmed fact IDs.
4. IF a ProgramEvaluation has no missing and no unconfirmed fact IDs, THEN THE Action_Card SHALL show a text statement that no required facts are missing or unconfirmed, instead of empty lists.
5. THE Action_Card SHALL show exactly one next step, rendered from the ActionNode's next-step key, and exactly one Handoff_Target.
6. THE Action_Card SHALL show the rule ID, rule version, and fixture version next to the label "Rule-based result" (or its Spanish equivalent), identical to the values in the referenced ProgramEvaluation.
7. THE Bridge_MA SHALL display MatchStatus only as "may match", "likely does not match", or "can't tell yet" (or the Spanish equivalents), and SHALL display no text stating that the resident is eligible, qualified, approved, or guaranteed a benefit.
8. IF at least one cited Source is `reviewed` and has a non-null URL, THEN THE Action_Card SHALL show as the Handoff_Target a link to the URL of the first such Source in the RuleVersion's source ID order, with link text naming the Source publisher and identifying the link as an external official page.
9. IF no cited Source is both `reviewed` and has a non-null URL, THEN THE Action_Card SHALL show as the Handoff_Target one human help option (legal aid, program office, or a general help line referenced by name only) and SHALL render no link to any unreviewed Source URL.
10. THE Bridge_MA SHALL limit external links on Action_Cards to URLs of `reviewed` Sources, and SHALL provide no control that submits an application or sends ResidentFacts to an external site.
11. THE Action_Card SHALL list each EvidenceRequirement of its ActionNode by EvidenceType dictionary label, marked `required` or `helpful`, with the names of the other ActionNodes that reuse that EvidenceType.

### Requirement 8: Explanations

**User Story:** As a demo resident, I want a plain-language explanation that is clearly marked by origin, so that I know what is a rule result and what is generated text.

#### Acceptance Criteria

1. WHEN the Action_Card displays an explanation, THE Action_Card SHALL show the explanation in a text region separate from the "Rule-based result" region. WHERE the text is output from a configured model provider, THE Action_Card SHALL label the explanation "Generated explanation" (or its Spanish equivalent) and the ActionNode's ExplanationOrigin SHALL be `generated`. WHERE the text is a dictionary template or the deterministic demo fallback, THE Action_Card SHALL label the explanation "Rule-based explanation (template)" (or its Spanish equivalent) and the ActionNode's ExplanationOrigin SHALL be `rule_based`.
2. WHEN the Bridge_MA requests an explanation, THE Bridge_MA SHALL pass the Model_Adapter only the program ID, the MatchStatus already recorded in that ProgramEvaluation, and the active locale, and SHALL pass no ResidentFact value, free-text intake input, or `neighborhood` fact.
3. THE Bridge_MA SHALL request an explanation only after all three ProgramEvaluations, the Action_Graph, and every Deadline are computed and the Graph_Validator has returned no error. IF the Graph_Validator returns any error, THEN THE Bridge_MA SHALL request no explanation.
4. IF no model provider is configured, or the Model_Adapter call fails, returns empty text, or returns no result within 5 seconds, THEN THE Bridge_MA SHALL use the deterministic demo fallback for that ActionNode, set that ActionNode's ExplanationOrigin to `rule_based`, label the text "Rule-based explanation (template)" (or its Spanish equivalent), keep the rule-based result shown, and let the resident continue to Step 4 with no blocking error.
5. WHEN the Bridge_MA receives explanation text from the Model_Adapter or the deterministic demo fallback, THE Bridge_MA SHALL leave every ActionNode's MatchStatus, Urgency, SourceFreshness, FactConfirmation, missing and unconfirmed fact IDs, rule ID, rule version, fixture version, Deadline, Handoff_Target, ActionEdges, and Action_Graph order exactly as before.
6. THE Action_Card SHALL render explanation text as plain text of at most 600 characters, cut at 600 characters if longer, with no clickable links, markup, or controls taken from that text.
7. WHEN the deterministic demo fallback is used, THE Model_Adapter SHALL return the same text for the same program ID, MatchStatus, and locale, SHALL make no network request, and SHALL need no API key; THE Bridge_MA SHALL treat that text as `rule_based` and never label that text "Generated explanation".

### Requirement 9: Deadlines

**User Story:** As a demo resident, I want to see a deadline only when it is safely supported, so that I am not misled by a guessed date.

#### Acceptance Criteria

1. THE Deadline_Calculator SHALL return exactly one Deadline for each ActionNode, either `computed` or `unknown`; an `unknown` Deadline SHALL carry exactly one reason from `source_unreviewed`, `unsupported`, or `facts_unconfirmed`.
2. WHEN every Source cited by the ActionNode's RuleVersion is `reviewed`, the RuleVersion defines a deadline calculation, and every ResidentFact that calculation requires is `confirmed` with a value other than `unknown`, THE Deadline_Calculator SHALL return a `computed` Deadline with a `YYYY-MM-DD` date, the rule ID, and the ID of the cited `reviewed` Source.
3. IF any cited Source is `unreviewed` or `stale`, THEN THE Deadline_Calculator SHALL return an `unknown` Deadline with reason `source_unreviewed`, whatever the state of the RuleVersion or ResidentFacts.
4. IF every cited Source is `reviewed` and the RuleVersion defines no deadline calculation, THEN THE Deadline_Calculator SHALL return an `unknown` Deadline with reason `unsupported`, whatever the state of the ResidentFacts.
5. IF every cited Source is `reviewed`, the RuleVersion defines a deadline calculation, and any required ResidentFact is `unknown`, missing, or `unconfirmed`, THEN THE Deadline_Calculator SHALL return an `unknown` Deadline with reason `facts_unconfirmed`.
6. THE Deadline_Calculator SHALL compute each Deadline only from the RuleVersion, the cited Sources' review status, and confirmed ResidentFacts; given identical inputs the Deadline_Calculator SHALL return an identical Deadline, and SHALL NOT read the system date, the `neighborhood` fact, area data, or Model_Adapter output.
7. WHILE an ActionNode's Deadline is `unknown`, THE Action_Card and the Handoff_View SHALL show "No deadline shown. Ask a human helper about timing." (and its Spanish equivalent) in place of a date, and SHALL show no date, day count, or date range for that ActionNode.
8. WHILE an ActionNode's Deadline is `computed`, THE Action_Card and the Handoff_View SHALL show the date with its rule ID and source ID under the label "Rule-based result".
9. IF more than one `unknown` reason applies to an ActionNode, THEN THE Deadline_Calculator SHALL select the single reason by the precedence `source_unreviewed`, then `unsupported`, then `facts_unconfirmed` (the Deadline reason precedence).

### Requirement 10: Reusable evidence

**User Story:** As a demo resident, I want one list of documents and which actions each one helps, so that I gather each document once.

#### Acceptance Criteria

1. WHEN the resident opens the Evidence_View, THE Evidence_View SHALL list each EvidenceType referenced by at least one ActionNode's EvidenceRequirement exactly once, under its dictionary label in the active locale, in order of first appearance reading ActionNodes in Action_Graph order and then fixture order within each ActionNode.
2. THE Evidence_View SHALL show, for each listed EvidenceType, the name of every ActionNode that references the EvidenceType, in Action_Graph order, each with a text label `required` or `helpful` from that ActionNode's EvidenceRequirement.
3. IF a fixture contains an EvidenceRequirement that references an undefined EvidenceType ID or action ID, or repeats an EvidenceType ID and action ID pair, THEN THE Fixture_Loader SHALL reject the fixture, return an error naming each offending ID, and expose no partially loaded EvidenceRequirements.
4. WHILE the RuleVersion of any ActionNode that references a listed EvidenceType is `synthetic`, THE Evidence_View SHALL show next to that EvidenceType the label "Demo rule, not verified against official policy" (and its Spanish equivalent).
5. IF the current Action_Graph has no EvidenceRequirements, THEN THE Evidence_View SHALL show a text message that no documents are listed, directing the resident to a human help option.
6. THE Evidence_View SHALL provide no control that uploads, captures, scans, or stores a document.

### Requirement 11: Uncertainty and human help

**User Story:** As a demo resident, I want to know what is uncertain and who can help, so that I can get a person involved when the app cannot decide.

#### Acceptance Criteria

1. WHEN the Help_View is displayed, THE Help_View SHALL list every program whose MatchStatus is `cant_tell`, and for each program show the dictionary name of every missing and unconfirmed fact ID, under separate text labels.
2. WHEN the Help_View is displayed, THE Help_View SHALL list the rule ID and rule version of every `synthetic` RuleVersion in the current Action_Graph, and the publisher, title, and SourceFreshness of every cited Source not `reviewed`.
3. IF a ResidentFact for the Notice to Quit has confirmation `confirmed` and value `true`, THEN THE Help_View SHALL show a legal aid human help option with text telling the resident to ask legal aid any questions about the notice.
4. WHEN the Help_View or the Handoff_View is displayed, THE Bridge_MA SHALL show a text statement that the app does not assess whether a Notice to Quit is valid.
5. THE Bridge_MA SHALL display no text stating or implying that a Notice to Quit is valid, invalid, enforceable, or defective, or what legal effect the notice has.
6. WHEN the Help_View or the Handoff_View is displayed, THE Bridge_MA SHALL show a text statement that results are not an eligibility decision and do not come from a government agency.
7. WHEN the Help_View is displayed, THE Help_View SHALL list each human help option (legal aid, program office, general help line) by name only, with no phone number, address, email, or other contact detail unless the detail comes from a cited `reviewed` Source.
8. IF no ProgramEvaluation has MatchStatus `cant_tell`, THEN THE Help_View SHALL show a text message that no program is currently marked "can't tell yet", and SHALL still show the content of criteria 2, 4, 6, and 7.

### Requirement 12: English and Spanish display

**User Story:** As a Spanish-speaking resident, I want the whole journey in Spanish, so that I understand every step.

#### Acceptance Criteria

1. THE Localizer SHALL render every user-facing string in all six journey steps from the dictionary matching the URL locale segment (`/en` uses `en`, `/es` uses `es`), including headings, labels, buttons, validation errors, MatchStatus labels, Recommendation_Dimension labels, synthetic-rule labels, Deadline text, and human help text; no user-facing string SHALL be hard-coded outside the dictionaries.
2. THE `en` and `es` dictionaries SHALL contain the same set of keys, and every value SHALL be a non-empty string.
3. THE Localizer SHALL render structured outcomes without changing MatchStatus, the five Recommendation_Dimensions, action IDs, program IDs, rule IDs, rule versions, fixture version, source IDs, Deadline kind/date/reason, ResidentFact values and confirmation states, ActionNode count and order, or the set of ActionEdges (from ID, to ID, reason key). Only display text SHALL differ.
4. WHEN the resident activates a language control, THE Bridge_MA SHALL show the same journey step at the matching URL under the other locale prefix (for example, `/en/story` becomes `/es/story`) without a full document reload.
5. WHEN a language switch completes, THE Bridge_MA SHALL keep every ResidentFact (value and confirmation state) and the Action_Graph unchanged, held in Session_State only, without writing to cookies, localStorage, sessionStorage, or any server.
6. WHEN a language switch completes, THE Bridge_MA SHALL set `<html lang>` to the new locale and render every visible string from that locale's dictionary.
7. IF the resident reloads or opens a locale URL directly for steps 2 through 6 while Session_State has no ResidentFacts, THEN THE Bridge_MA SHALL show a text message in the URL's locale with a link to step 1, and SHALL NOT show any Action_Card, Evidence_View content, or HandoffPacket.

> Note: Criterion 12.4 supersedes provisional decision D-018 (full page load); recorded as D-031 (approved by developer delegation, 2026-10-24).

### Requirement 13: Printable bilingual handoff

**User Story:** As a demo resident, I want a printed English/Spanish summary, so that I can bring it to a caseworker or legal aid office.

#### Acceptance Criteria

1. WHEN the resident opens the Handoff_View, THE Bridge_MA SHALL build exactly one HandoffPacket from the Action_Graph, ResidentFacts, and EvidenceRequirements in Session_State, set the generated-at date to the current local date, and build the HandoffPacket without calling the Model_Adapter.
2. THE Handoff_View SHALL render every HandoffPacket section twice: an English block with `lang="en"` and a Spanish block with `lang="es"`, with the same sections in the same order and identical action IDs, rule IDs, rule versions, fixture version, MatchStatus values, Recommendation_Dimension values, and dates.
3. THE Handoff_View SHALL show, in each language block: (a) each confirmed ResidentFact with its value; (b) each required fact that is `unknown`, missing, or unconfirmed under unknown facts, never shown as `false`; (c) the three ActionNodes in Action_Graph order, each with its five Recommendation_Dimensions as text labels, rule ID, rule version, and Deadline; (d) each EvidenceType once, marked `required` or `helpful`, with the ActionNodes that reuse the EvidenceType; (e) each Handoff_Target; (f) the fixture version and generated-at date.
4. THE Handoff_View SHALL show "Fictional demo" (and its Spanish equivalent) at the top of each language block, the "Demo rule, not verified against official policy" label on every ActionNode whose RuleVersion is `synthetic`, and the Requirement 11 statements that results are not an eligibility decision, are not from a government agency, and do not assess whether a Notice to Quit is valid.
5. WHEN the Handoff_View is printed in portrait on US Letter or A4, THE Handoff_View SHALL convey every MatchStatus, Recommendation_Dimension, and label in text without relying on color, hide site navigation, the language switcher, and the print control, show the full URL text next to each official-portal Handoff_Target, and print every section with no text cut off and no content left in collapsed or hidden regions.
6. THE Handoff_View SHALL provide exactly one keyboard-operable print control that opens the browser print dialog, and no control that submits, sends, shares, uploads, or stores the HandoffPacket.
7. IF Session_State holds no Action_Graph, or the Graph_Validator returns any error, THEN THE Handoff_View SHALL render no HandoffPacket, show a text message directing the resident to human help with a link back to the Fact_Review, and leave ResidentFacts unchanged.
8. WHERE an ActionNode's Deadline is `unknown`, THE Handoff_View SHALL show "No deadline shown. Ask a human helper about timing." (and its Spanish equivalent); WHERE the Deadline is `computed`, THE Handoff_View SHALL show the date with its rule ID and source ID.

### Requirement 14: Privacy and demo fallback

**User Story:** As a demo presenter, I want the app to run without keys, storage, or tracking, so that the demo is safe and reliable.

#### Acceptance Criteria

1. WHILE no model API key is configured, THE Bridge_MA SHALL complete all six journey steps using the deterministic demo fallback for every explanation, with no step blocked and no error shown because a key is missing.
2. THE Bridge_MA SHALL hold ResidentFacts, ProgramEvaluations, the Action_Graph, and the HandoffPacket in Session_State only, writing none of them to localStorage, sessionStorage, IndexedDB, Cache Storage, or any other browser storage, so that reloading restores no previously entered ResidentFact.
3. WHILE no model provider is configured, THE Bridge_MA SHALL make no outbound network request whose URL, headers, or body contains any ResidentFact value or Intake_Form text.
4. THE Bridge_MA SHALL set no cookies, through client-side script or server response headers, on any page in the six journey steps.
5. THE Bridge_MA SHALL load no analytics, tracking, or telemetry script and send no such network requests on any page in the six journey steps.
6. WHERE a model provider is configured, THE Bridge_MA SHALL send that provider only the Requirement 8, criterion 2 payload (program ID, MatchStatus, and active locale) and no ResidentFact value, Intake_Form text, or `neighborhood` fact.
7. WHERE a model provider is configured, IF the provider request fails or returns no response within 5 seconds, THEN THE Bridge_MA SHALL use the deterministic demo fallback, keep all Session_State values unchanged, and continue the journey.
8. THE Model_Adapter `normalize` operation SHALL run locally only, using the deterministic demo fallback, and SHALL NOT send Intake_Form text to any provider.

### Requirement 15: Accessibility

**User Story:** As a resident using a keyboard or screen reader, I want to complete the journey, so that I can get the same help as anyone else.

#### Acceptance Criteria

1. THE Bridge_MA SHALL let the resident reach every interactive element in all six journey steps with Tab and Shift+Tab alone, in a focus order matching the visual reading order, with no focus trap; links SHALL activate with Enter, and buttons, checkboxes, and radio inputs SHALL activate with Space or Enter per their native role.
2. WHEN an interactive element receives keyboard focus, THE Bridge_MA SHALL show a focus indicator at least 2 CSS pixels thick, not hidden by any page style, in both locales.
3. THE Bridge_MA SHALL render exactly one `h1` per journey step, with no heading level skipping downward by more than one; every input SHALL have a visible, programmatically associated label, and every group of choice inputs (including "I don't know") SHALL have a visible group label.
4. THE Bridge_MA SHALL show each Recommendation_Dimension as a text label on screen and in print, so that removing all color leaves every dimension readable.
5. WHILE the viewport is 320 CSS pixels wide, THE Bridge_MA SHALL lay out each of the six steps in both `en` and `es` with no horizontal scrolling and no clipped or overlapping text.
6. THE Bridge_MA documentation SHALL record, for each step in both locales, the date the automated axe checks ran and the number of violations reported, SHALL state that automated checks are not full validation and that manual assistive-technology testing and expert review have not been done, and SHALL make no WCAG conformance claim.
7. IF the resident submits the Intake_Form with one or more invalid values, THEN THE Intake_Form SHALL move focus to the first invalid input, and each error SHALL be text in the active locale that names the field and describes the accepted input, not relying on color alone, with all other entered values kept.
8. WHEN the resident moves to a different journey step, THE Bridge_MA SHALL move keyboard focus to that step's `h1`.
9. WHILE a locale is active, THE Bridge_MA SHALL take every visible label, heading, error message, and accessible name from that locale's dictionary and set `<html lang>` to that locale; any Source publisher or title shown in the other language SHALL carry a matching `lang` attribute.

### Requirement 16: Correctness properties

**User Story:** As the developer, I want property-based tests on the domain modules, so that the safety boundaries hold for many inputs.

#### Acceptance Criteria

1. FOR ALL generated fact sets (each fact ID from the v1 fixture's RuleVersion required fact IDs plus `neighborhood`, with value `true`, `false`, `unknown`, or an in-range typed value, and confirmation `confirmed` or `unconfirmed`) and a fixed reference date, running the Rules_Engine and Graph_Builder twice on the same input SHALL produce deeply equal ProgramEvaluations and Action_Graphs (determinism).
2. FOR ALL generated fact sets where at least one required fact of a RuleVersion is `unknown` or absent, every predicate over that fact SHALL evaluate to `unknown`, that program's MatchStatus SHALL be other than `may_match`, and SHALL be `cant_tell` when no other required predicate evaluates to `false`.
3. FOR ALL generated fact sets, changing the value of any unconfirmed ResidentFact SHALL leave every ProgramEvaluation and the Action_Graph deeply equal; and for any required fact, the predicate results, MatchStatus, Urgency, and Deadline SHALL be identical whether that fact is absent or present-but-unconfirmed, with only the missing versus unconfirmed fact-ID listing and FactConfirmation allowed to differ.
4. FOR ALL generated fact sets, setting `neighborhood` to any generated value (a string of 0 to 100 characters, `unknown`, or absent) under either confirmation state SHALL leave every ProgramEvaluation and the Action_Graph deeply equal.
5. FOR ALL generated Model_Adapter behaviors (a returned explanation string of 0 to 2,000 characters, or a thrown error), the ProgramEvaluations and the Action_Graph SHALL be deeply equal to those produced with the deterministic demo fallback; only explanation text and ExplanationOrigin SHALL differ.
6. FOR ALL Action_Graphs the Graph_Builder produces from generated fact sets, every ActionNode SHALL reference a ProgramEvaluation present in the Rules_Engine output, and a RuleVersion ID and Source ID present in the loaded fixture.
7. FOR ALL generated graphs (1 to 10 ActionNodes with action IDs from a pool of 5, and 0 to 20 ActionEdges) containing at least one repeated action ID, THE Graph_Validator SHALL return a `duplicate_id` error naming every repeated ID.
8. FOR ALL generated graphs (1 to 10 ActionNodes with unique IDs, 0 to 20 ActionEdges) containing at least one ActionEdge whose from or to ID is absent, THE Graph_Validator SHALL return a `dangling_edge` error naming every such ActionEdge.
9. FOR ALL generated graphs (1 to 10 ActionNodes with unique IDs, 0 to 20 ActionEdges between existing IDs, self-loops included), THE Graph_Validator SHALL return a `cycle` error if and only if a reference cycle check over the same edges finds a cycle, and every action ID listed in the error SHALL lie on that cycle.
10. FOR ALL Action_Graphs the Graph_Builder produces from generated fact sets, the structured output for `en` SHALL be deeply equal to the structured output for `es` in every MatchStatus, Recommendation_Dimension, action ID, rule ID, rule version, fixture version, Deadline, and ActionEdge; only dictionary-rendered strings SHALL differ.
11. FOR ALL generated combinations of Source review status (`reviewed`, `unreviewed`, `stale`), deadline calculation (present or absent), and input fact state (`confirmed`, `unconfirmed`, `unknown`), THE Deadline_Calculator SHALL return a `computed` Deadline only when the Source is `reviewed`, a calculation is present, and all input facts are confirmed; otherwise THE Deadline_Calculator SHALL return an `unknown` Deadline whose reason follows the Deadline reason precedence in Requirement 9, criterion 9.
12. FOR ALL valid fixtures generated within the fixture schema, parsing with the Fixture_Loader, serializing to JSON, and parsing again SHALL produce a deeply equal fixture (round trip).
13. THE property tests SHALL use fictional generated data only, run at least 100 cases per property, and pass under `npx vitest --run`.
