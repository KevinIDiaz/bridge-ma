Bridge MA - Hackachusetts Build Playbook  
  
Winning concept  
  
Bridge MA is a Massachusetts case-execution engine, not a resource directory or general chatbot. A resident describes a crisis or uploads a fictional Massachusetts notice; Bridge builds a sourced action graph showing the next action, missing facts, reusable evidence, deadlines, and the correct official or human handoff.	  
  
Pitch: Government websites tell you what exists. Bridge MA helps you finish the next right step before the clock runs out.  
  
Demo one integrated crisis bundle: SNAP + RAFT + utility shutoff protection (or MassHealth) for a fictional Spanish-speaking Boston single parent who lost a job and received a Notice to Quit.  
  
Core differentiator: the Action Graph  
  
Each recommendation must contain:  
  
status: likely / needs answer / not matched / urgent human review  
why it appeared  
exact official source and reviewed date  
deterministic rule vs. model inference  
one next action  
evidence needed and evidence reusable elsewhere  
deadline, when safely computable  
official portal or human handoff  
  
Use an LLM only for intake normalization, translation, OCR cleanup, and plain-language explanation. Keep routing and deadlines deterministic. Never guarantee eligibility, give legal advice, impersonate an agency, or auto-submit an application.  
  
Massachusetts facts to seed  
  
SNAP can be started with name, address if any, and signature; decisions are generally within 30 days, sometimes 7 days for expedited service. If approved, benefits relate back to the application date. https://www.mass.gov/how-to/supplemental-nutrition-assistance-program-snap-formerly-known-as-food-stamps  
One lease can satisfy several DTA verification needs, including shelter cost, residency, and household information. https://www.mass.gov/info-details/program-verifications-what-information-you-need-to-provide  
RAFT may provide up to $7,000 in 12 months. Preflight evidence includes ID, housing proof, crisis proof, and income. After the resident applies, a landlord application is also required; failure to submit within 21 days can time out the application. https://www.mass.gov/how-to/apply-for-raft-emergency-help-for-housing-costs  
A Notice to Quit is not an eviction order; only a court can order removal. Common notice periods are 14 days for nonpayment and 30 days for other reasons, but circumstances matter. https://www.mass.gov/info-details/receiving-a-notice-to-quit  
Massachusetts utility shutoff protections can apply for financial hardship plus conditions such as serious illness, an infant under 12 months, or winter heat protection from November 15 through March 15. https://www.mass.gov/info-details/when-am-i-protected-from-having-my-utilities-shut-off  
Executive Order 615 requires executive department agencies to address language barriers. https://www.mass.gov/executive-orders/no-615-promoting-access-to-government-services-and-information-by-identifying-and-minimizing-language-access-barriers  
  
Every rule record needs jurisdiction, official URL, effective/review date, confidence type, and a visible freshness indicator.  
  
Hackachusetts dataset use  
  
Use the MassGIS Environmental Justice block groups and Boston neighborhood estimates for aggregate rollout/equity analysis, never for individual eligibility. They can show where voice, low-bandwidth, or multilingual outreach deserves priority. Do not infer an individual's language, income, race, or eligibility from geography.  
  
Optionally use Boston 311 as an aggregate neighborhood-friction signal for outreach. It is not a benefits source and must never be linked to a person's eligibility.  
  
The event portal warns that referrals are not confirmed benefits or beds; Bridge must preserve that distinction.  
  
Official sub-tracks  
  
Better Together  
  
Gap: open data describes places, but not completion across fragmented agencies. Main blindspot: map-first and account-first experiences exclude residents with limited broadband, literacy, language access, or accessibility needs.  
  
Ideas: (1) Bridge MA Action Graph; (2) Civic Errand Router combining MBTA accessibility alerts, office hours, appointment rules, and checklists.  
  
Kiro archetype: specs define the action graph and safety invariants; steering captures Massachusetts terminology; hooks enforce provenance and translation parity; MCP fetches official sources; property-based tests protect deadlines and confidence states.  
  
Citizen-Friendly Digital Government  
  
Gap: residents repeat facts while document requirements differ subtly, and official pages/forms drift. Main blindspot: chatbots hide uncertainty and source age.  
  
Ideas: (1) Evidence Passport mapping resident-approved document metadata to several programs; (2) Notice-to-Next-Step turning a government letter into a confirmed-fact checklist and human handoff.  
  
Kiro archetype: separate specs for classification, retrieval, deadline calculation, and escalation; a hook rejects unsourced conclusions; MCP queries an allowlisted official-source registry.  
  
Responsive Neighborhood Services  
  
Gap: 311 measures reports, not resolution or unreported need. Main blindspot: high digital participation can look like high need, while silence is misread as no need.  
  
Ideas: (1) Silent Queue, aggregate-only under-reporting analysis; (2) Resolution Receipt, a portable record of promises and blockers across departments.  
  
Kiro archetype: specs require minimum cell sizes and prohibit individual scoring; hooks run privacy checks; MCP pulls 311 and EJ data; property tests prevent small-cell leakage.  
  
Emergency Readiness  
  
Gap: hazard alerts rarely include the accessible, household-specific prerequisites for action. Main blindspot: “go to a shelter” is not actionable without capacity, accessibility, transport, and documentation details.  
  
Ideas: (1) Ready Chain, an offline household action graph; (2) Mutual Aid Capacity Ledger with expiring organizational capacity signals.  
  
Kiro archetype: hazard state-machine specs, offline fallbacks, multilingual hooks, OpenFEMA/MBTA MCP, and tests that never present historical declarations as live alerts.  
  
Four unconventional Civic Action domains  
  
Clockwork Civic (procedural justice): turn a notice into a sourced timeline and human-review gate. Couple court procedure, appeals, agency notices, and legal-aid directories. PBT fuzzes dates, weekends, and ambiguous classifications.  
Friction Atlas (administrative burden): measure pages, accounts, proofs, visits, and handoffs for a civic goal. Report burden separately for screen-reader use, low bandwidth, no car, limited English, and no printer.  
When This, Then That (rights triggers): map a life event or notice to protections and requests the resident can make. Couple DPU rules, EO 615, ADA guidance, and program verification pages; generate scripts without legal conclusions.  
Warm Handoff Protocol: a resident-controlled, expiring packet of goals, completed steps, missing evidence, language/access needs, and consent. A printable QR/code works without an account; property tests guarantee expired packets reveal nothing.  
  
MVP for three developers  
  
Must work live:  
  
Spanish text or browser voice input with a fictional persona.  
One fictional Notice to Quit upload.  
Extraction of document type/date/reason with user confirmation.  
An action graph for SNAP, RAFT, and utility protection or MassHealth.  
A document reuse view.  
Deadline/urgency view with uncertainty and human escalation.  
Exact official citations on every recommendation.  
Printable bilingual handoff.  
Small aggregate equity view using EJ/neighborhood data.  
  
Simulate provider availability and case status and label both as demo data. Do not submit to agencies, store uploads after the session, perform identity verification, or build a universal benefits catalog.  
  
Architecture  
  
Next.js + TypeScript PWA  
Typed deterministic rule engine  
Postgres/Supabase or SQLite for demo  
Tables: programs, rule_versions, sources, evidence_types, requirement_edges, action_nodes, action_edges, handoff_packets  
MCP during development: official web fetch/search, GitHub, database tooling  
Metrics: citation coverage, stale rules, path completion  
Schema validation on every model output  
  
Repository proof of Kiro  
  
.kiro/  
  specs/action-graph/{requirements.md,design.md,tasks.md}  
  specs/notice-intake/{requirements.md,design.md,tasks.md}  
  specs/warm-handoff/{requirements.md,design.md,tasks.md}  
  steering/{product,massachusetts-domain,safety-and-privacy,accessibility,sources-and-provenance,testing}.md  
  hooks/{validate-rule-provenance,test-action-graph,check-accessibility-copy,scan-demo-pii}.json  
  settings/mcp.json  
  workflows/verify-official-sources.md  
docs/{architecture,data-dictionary,source-register,kiro-usage}.md  
fixtures/fictional-notice-to-quit.pdf  
src/  
tests/  
README.md  
  
Commit /.kiro at repository root and never ignore it.  
  
Copy-paste Kiro prompts  
  
1. Steering  
  
We are building Bridge MA, a Massachusetts civic-action demo for Hackachusetts. Before writing application code, create focused project steering files under .kiro/steering for product boundaries, Massachusetts terminology, safety/privacy, WCAG accessibility, official-source provenance, and testing. The product helps a resident complete the next step but never guarantees eligibility, gives legal advice, impersonates an agency, or submits an application. Every rule needs official URL, jurisdiction, effective/review date, and confidence type. Show proposed files before implementation.  
  
2. Main spec  
  
Create a Kiro spec named action-graph with EARS-style requirements and separate requirements.md, design.md, and tasks.md. The user is a fictional Spanish-speaking Boston single parent who lost a job and received a Notice to Quit. Cover SNAP, RAFT, and Massachusetts utility shutoff protections. Include minimal fact collection, consent, likely-not-guaranteed language, citations, versioning, document reuse, deadline uncertainty, human escalation, keyboard/screen-reader operation, printable handoff, no automatic submission, and deletion of uploaded demo documents. Identify property-based test invariants. Do not implement until requirements and design are approved.  
  
3. Rule model  
  
Design a typed rule-as-data model. Separate deterministic predicates from generated explanations. Model Program, RuleVersion, Source, ResidentFact, EvidenceType, RequirementEdge, ActionNode, Deadline, and Handoff. Every recommendation must explain why it fired, list missing facts, and cite an allowlisted official source. Add a small fixture dataset for SNAP, RAFT, and utility protection. Update design.md and tasks.md before coding.  
  
4. Property-based tests  
  
Implement the domain layer test-first. Add property-based tests proving: no recommendation lacks source/review date; not-matched never becomes eligible; deadlines never precede trigger dates; removing a qualifying fact cannot increase confidence; expired handoff packets reveal nothing; translation does not change rule outcome; neighborhood/EJ data never changes individual eligibility. Show failing-to-passing progression.  
  
5. Notice intake  
  
Create the notice-intake spec for one fictional Massachusetts Notice to Quit fixture. Extract type, issue date, stated reason, and confidence. Require user confirmation before facts enter the action graph. Ambiguous or low-confidence classifications route to a human. Never call the notice a court order. Store no raw upload after the session. Add unit, integration, and accessibility tests.  
  
6. UI  
  
Implement a mobile-first WCAG 2.2 AA-oriented English/Spanish flow: Tell your story -> Confirm facts -> Next three actions -> Documents to reuse -> Deadlines and human help -> Printable handoff. Use plain language, progressive disclosure, visible focus, semantic headings, ARIA live regions, large targets, and low-bandwidth mode. Every action shows source, last-reviewed date, why, missing facts, and official handoff. Do not use a chat-only interface.  
  
7. MCP and hooks  
  
Configure project MCP in .kiro/settings/mcp.json only for official web fetch/search, GitHub, and the development database. Keep secrets in environment variables and commit an example without credentials. Create hooks for rule provenance/schema validation, domain PBT/unit tests, locale parity and prohibited certainty language, and demo-PII scans. Block only on provenance, privacy, or domain-invariant failures. Document the measurable value of each MCP and hook.  
  
8. Final audit  
  
Audit this repository as a Hackachusetts judge. Verify .kiro is committed at root; requirements trace through design, tasks, code, and tests; hooks show evidence of use; steering shaped implementation; MCP is purposeful; PBT protects civic-safety invariants; README contains setup/testing; and docs/kiro-usage.md contains concrete examples. Produce a prioritized punch list and fix only P0/P1 issues after approval.  
  
Team split  
  
Developer 1: rules, graph, source register, PBT; owns action-graph spec.  
Developer 2: voice/text intake, bilingual accessibility, upload confirmation; owns notice-intake spec.  
Developer 3: action timeline, handoff export, aggregate equity view, deploy, hooks/MCP docs; owns warm-handoff spec.  
  
Merge by completed spec task. Preserve one compelling Kiro “caught this” story, ideally a provenance or deadline bug found by a hook/PBT.  
  
Three-minute demo  
  
0:00-0:20: fragmented crisis across three portals.  
0:20-0:55: Spanish voice + fictional notice upload + fact confirmation.  
0:55-1:35: ordered SNAP/RAFT/utility plan with Mass.gov citations.  
1:35-1:55: one lease reused across evidence needs.  
1:55-2:15: bilingual handoff + RAFT landlord 21-day dependency.  
2:15-2:40: voice/large-text/low-bandwidth; aggregate equity view that never changes eligibility.  
2:40-3:00: show specs, steering, hooks, MCP, and one PBT-caught bug.  
  
Submission essentials  
  
Public GitHub repo; free working demo; public video under three minutes; English submission/translation; text description; Civic Action track; detailed Kiro write-up; /.kiro at repo root; all source/assets/setup/testing instructions included; no unlicensed music/assets; no changes after submission closes.
