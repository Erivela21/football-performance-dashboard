# Retrospective Summary (Sprints 1–4)

Purpose: concise record of what went well, what to improve, and action items across sprints.

Format: Markdown (`docs/retrospective_summary.md`) for easy diffs/review. Each sprint captures “Went Well”, “To Improve”, and “Actions” with owners when known.

## Sprint 1 (Nov 30 – Dec 1, 2024)
- Went Well: Azure infra stood up quickly; CI/CD to App Service working; DB connectivity validated with `/health`.
- To Improve: Secrets rotation checklist; clearer firewall steps for DB.
- Actions: Document firewall runbook; add secrets rotation SOP.

## Sprint 2 (Dec 2 – Dec 3, 2024)
- Went Well: Core CRUD + JWT auth landed; UI shell with navigation live; demo user idea surfaced.
- To Improve: UX polish; reduce friction for testers.
- Actions: Add demo user seeding (done in Sprint 3/4); plan UI polish stories.

## Sprint 3 (Dec 4 – Dec 8, 2024)
- Went Well: Teams CRUD + cascade delete stable; analytics (training load, injury risk) functional; schedule flows working.
- To Improve: Add time filters and better data richness; document cascade rules.
- Actions: Enrich seed data; add analytics filters; write cascade deletion notes.

## Sprint 4 (Dec 9 – Dec 12, 2024)
- Went Well: ML predictions shipped (with synthetic fallback); UI polish (animations, toggles) improved experience.
- To Improve: Finish export (PDF/CSV) and analytics page renderers; surface health/monitoring in UI.
- Actions: Complete PB-09 (export), PB-10 (team theming UI), PB-11 (analytics UI), add health status surfacing.

