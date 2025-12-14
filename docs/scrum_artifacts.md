# Scrum Artifacts & Sprint Snapshots

Purpose: single place to track Scrum artifacts (sprint backlog snapshots, reviews, retrospectives, Definition of Done) for the Football Performance Dashboard.

## Format
- File: `docs/scrum_artifacts.md` (Markdown for easy diff/review in Git).
- Each sprint section captures: timeframe, roles, goals, committed backlog items, outcome, review notes, retrospective summary, and carry-overs.
- Status labels: `Done`, `In Progress`, `Deferred`, `Blocked`.

## Definition of Done
- Source of truth: `README.md` (“Definition of Done” section).
- Shortform: code follows PEP8, tests pass, API documented, code reviewed, merged to main, deployed, verified in prod, PO accepted.

## Sprint Snapshots

### Sprint 1 (Nov 30 – Dec 1, 2024)
- Roles: SM Gonzalo, PO Enrique, Backend Matthew, DevOps Manu, Cloud Maximiliano, QA Elias.
- Goal: Azure infra & initial deployment.
- Committed backlog (IDs from `docs/product_backlog.md`): PB-01, PB-02 (infra/setup variants), PB-04 (skeleton).
- Outcome: **Done** — Azure App Service/SQL provisioned, CI/CD wired, health check live.
- Review notes: App reachable; DB connectivity verified via `/health`.
- Retro summary: Keep CI/CD cadence; improve secrets rotation checklist; add DB firewall runbook.
- Carry-over: None.

### Sprint 2 (Dec 2 – Dec 3, 2024)
- Roles: SM Maximiliano, PO Gonzalo, Backend Enrique, Frontend Elias, DevOps Matthew, QA Manu.
- Goal: Core CRUD, auth, UI shell.
- Committed: PB-01 (auth), PB-02 (teams), PB-03 (players), PB-04 (sessions/stats), PB-08 (schedule stub), PB-09 (export stub).
- Outcome: **Done** — Players/sessions/stats CRUD, JWT auth, sidebar UI, placeholder analytics tabs.
- Review notes: Auth flow verified with JWT; nav usable; analytics placeholders acceptable for next sprint.
- Retro summary: Prioritize UX polish next sprint; add demo user seeding for ease of testing; keep router-per-domain structure.
- Carry-over: PB-09 (export) stays Todo.

### Sprint 3 (Dec 4 – Dec 8, 2024)
- Roles: SM Manu, PO Matthew, Backend Gonzalo, Frontend Enrique, DB Elias, QA Maximiliano.
- Goal: Full CRUD & team management, schedule, analytics made functional.
- Committed: PB-02, PB-03, PB-04, PB-05, PB-06, PB-08.
- Outcome: **Done** — Teams CRUD + cascade delete, schedule API/UI, functional Training Load & Injury Risk analytics.
- Review notes: Cascade delete verified; SQL GROUP BY fixes for Azure; charts render with fixed heights.
- Retro summary: Add time filters to analytics; improve seed data richness; document cascade rules.
- Carry-over: None.

### Sprint 4 (Dec 9 – Dec 12, 2024)
- Roles: SM Elias, PO Manu, ML Enrique, Backend Maximiliano, Frontend Gonzalo, QA Matthew.
- Goal: ML model, UI polish, AI recommendations.
- Committed: PB-07, PB-05/06 UX polish, PB-09 (export wiring), PB-10 (team theming), PB-11 (UI renderers).
- Outcome: **Done** for ML endpoints/UI polish; **In Progress** PB-09/10/11 frontend wiring.
- Review notes: ML predictions available with synthetic fallback; loading animations added; analytics submenu toggle fixed.
- Retro summary: Finish export + analytics renderers; surface monitoring/health in UI; consider React migration (PB-12).
- Carry-over: PB-09, PB-10, PB-11 -> Todo lane.

## Working Agreements
- Keep backlog IDs stable (PB-xx). Mirror sprint commitments against `docs/product_backlog.md`.
- At sprint close, snapshot Kanban state into this file and note carry-overs.
- Reviews capture what was demonstrated; retros capture improvements/experiments for next sprint.

## Open Actions
- Wire UI renderers for Training Load / Injury Risk (PB-11).
- Implement export (PDF/CSV) in UI using existing jsPDF CDN (PB-09).
- Add team theme switcher UI state (PB-10).

