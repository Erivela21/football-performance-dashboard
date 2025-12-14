# Product Backlog & Kanban Snapshot

Purpose: single place to track product work (past and upcoming), status, and ownership for the Football Performance Dashboard.

## Format
- File: `docs/product_backlog.md` (Markdown; easy to diff/review in Git and render in GitHub).
- Columns: `ID`, `User Story`, `Priority`, `Status`, `Acceptance Criteria (summary)`, `Notes`.
- Status values: `Todo`, `In Progress`, `Review`, `Done`, `Blocked`.
- Priorities: `P0` (must-have), `P1` (high), `P2` (medium), `P3` (low/nice-to-have).

## Product Backlog (current view)
| ID | User Story | Priority | Status | Acceptance Criteria (summary) | Notes |
|---|---|---|---|---|---|
| PB-01 | As a coach, I can register/login and manage my session securely | P0 | Done | JWT auth, password hashing, token expiry, protected routes enforced | Shipped (FastAPI auth router) |
| PB-02 | As a coach, I can CRUD teams and assign colors | P0 | Done | Create/update/delete team; color fields persisted; ownership enforced | Shipped |
| PB-03 | As a coach, I can CRUD players with photos and jersey numbers | P0 | Done | Create/update/delete player; optional photo_url stored; team ownership enforced | Shipped |
| PB-04 | As a coach, I can CRUD training sessions and stats | P1 | Done | Session + stats CRUD; validation; ties to players | Shipped |
| PB-05 | As a coach, I can view workload analytics (training load) | P1 | Done | `/analytics/training-load` returns load scores, recommendations, filters | Shipped |
| PB-06 | As a coach, I can view injury risk analytics | P1 | Done | `/analytics/injury-risk` with risk scores, factors, recommendations | Shipped |
| PB-07 | As a coach, I can see ML-powered injury predictions | P1 | Done | `/analytics/ml-injury-prediction` returns per-player risk + summary | Shipped |
| PB-08 | As a coach, I can manage match/training schedule | P1 | Done | Schedule CRUD, filters by team/type/important_only | Shipped |
| PB-09 | As a coach, I can export reports (PDF/CSV) from UI | P2 | Todo | Export buttons produce downloadable PDF/CSV with players + analytics summaries | UI wiring pending; jsPDF CDN already in `index.html` |
| PB-10 | As a coach, I can switch teams and see theme update | P2 | Todo | Selecting a team updates CSS variables; persists selection; applies to charts/cards | Frontend state hooks exist; needs UI completion |
| PB-11 | As a coach, I can view Training Load & Injury Risk pages in UI | P1 | Todo | Dedicated tabs render API data (charts, tables, recommendations) | Backend ready; UI renderers to implement |
| PB-12 | As a coach, I can manage data from a modern React frontend | P3 | Todo | Vite/React/Tailwind app runs locally; parity with current HTML app | `frontend/package.json` scaffold present |
| PB-13 | As a PO, I can see deployment health and logs | P2 | Todo | Health checks exposed; basic dashboard of App Service status/logs | Health endpoint exists; need UI/monitor surfacing |
| PB-14 | As a QA, I can run automated regression tests | P2 | Todo | CI runs pytest on PR; minimum coverage gate; fixture data stable | Basic tests exist; expand coverage + CI gate |

## Kanban Snapshot (today)
- **Todo:** PB-09, PB-10, PB-11, PB-12, PB-13, PB-14  
- **In Progress:** _(none)_  
- **Review:** _(none)_  
- **Done:** PB-01, PB-02, PB-03, PB-04, PB-05, PB-06, PB-07, PB-08  
- **Blocked:** _(none)_

## How to update
1) Edit this Markdown file in-place.  
2) Keep IDs stable; add new items as PB-15, PB-16, etc.  
3) Move items between Kanban lanes by updating the lists above and the `Status` column.  
4) When closing a sprint, snapshot the Kanban state (copy this section) into the sprint note.

