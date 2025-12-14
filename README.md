# Football Performance Dashboard

A professional trainer dashboard that ingests football athletes' data and transforms it into helpful insights to prevent injury and optimize workload.

**🌐 Live Demo:** [https://football-dashboard-cjgjefhrdncdaad6.westeurope-01.azurewebsites.net](https://football-dashboard-cjgjefhrdncdaad6.westeurope-01.azurewebsites.net)

---

## Team Members

| Name | GitHub |
|------|--------|
| Enrique | @Erivela21 |
| Gonzalo | @javronich1 |
| Matthew | @MMG1324 |
| Manu | @mmerino90 |
| Maximiliano | @maxi-max-max |
| Elias | @chelishino05 |

> **Note:** Product Owner and Scrum Master roles rotate each sprint to give everyone leadership experience.

## Documentation
- Product Backlog & Kanban: [`docs/product_backlog.md`](docs/product_backlog.md)
- Scrum Artifacts & Sprint Snapshots: [`docs/scrum_artifacts.md`](docs/scrum_artifacts.md)
- Retrospective Summary: [`docs/retrospective_summary.md`](docs/retrospective_summary.md)

---

## Sprint History

### 🏃 Sprint 1: Azure Infrastructure & Initial Deployment
**Dates:** November 30 - December 1, 2024

**Roles:**
| Role | Team Member |
|------|-------------|
| Scrum Master | Gonzalo |
| Product Owner | Enrique |
| Backend Developer | Matthew |
| DevOps Engineer | Manu |
| Cloud Infrastructure | Maximiliano |
| Testing & QA | Elias |

**Objectives:**
- Set up Azure cloud infrastructure
- Deploy initial application skeleton to Azure App Service
- Configure Azure SQL Database connection
- Establish CI/CD pipeline

**Deliverables:**
- ✅ Azure App Service created and configured (Python 3.11 runtime)
- ✅ Azure SQL Server provisioned in West Europe region
- ✅ Azure SQL Database created with firewall rules configured
- ✅ ODBC Driver 18 integration for SQL Server connectivity
- ✅ Environment variables configured in Azure (DB credentials, connection strings)
- ✅ GitHub Actions CI/CD pipeline established with build, test, and deploy stages
- ✅ Application successfully deployed and accessible via Azure URL
- ✅ Health check endpoint (`/health`) confirming database connectivity
- ✅ Application Insights configured for basic monitoring
- ✅ Initial FastAPI skeleton with SQLAlchemy ORM setup

**Technical Highlights:**
- Configured `pyodbc` with Azure SQL Database using ODBC Driver 18
- Set up GitHub Secrets for secure credential management
- Implemented automatic deployment on push to `main` branch
- Database connection pooling configured for production performance

---

### 🏃 Sprint 2: Core Features & UI Foundation
**Dates:** December 2-3, 2024

**Roles:**
| Role | Team Member |
|------|-------------|
| Scrum Master | Maximiliano |
| Product Owner | Gonzalo |
| Backend Developer | Enrique |
| Frontend Developer | Elias |
| DevOps Engineer | Matthew |
| Testing & QA | Manu |

**Objectives:**
- Build core CRUD API endpoints
- Create frontend UI structure with navigation
- Implement authentication system
- Add placeholder analytics pages

**Deliverables:**
- ✅ Complete Players API with CRUD operations
- ✅ Training Sessions API with CRUD operations  
- ✅ Session Statistics API for tracking player metrics
- ✅ JWT-based authentication system (register/login)
- ✅ Frontend dashboard with glass-panel UI design
- ✅ Navigation sidebar with tabs: Home, Teams, Players, Schedule, Analytics
- ✅ **Analytics section created with sub-pages:**
  - Training Load page (placeholder - no data visualization yet)
  - Injury Risk page (placeholder - no data visualization yet)
- ✅ User login/registration modals
- ✅ Basic responsive design with Tailwind CSS
- ✅ Demo user auto-creation on startup (demo_coach / Coach1234)

**Technical Highlights:**
- FastAPI routers organized by domain (players, sessions, stats, auth)
- Pydantic schemas for request/response validation
- SQLAlchemy models with relationships (Player → Team, Session → Player)
- Protected endpoints requiring JWT authentication
- Frontend state management with vanilla JavaScript

---

### 🏃 Sprint 3: Full CRUD & Team Management
**Dates:** December 4-8, 2024

**Roles:**
| Role | Team Member |
|------|-------------|
| Scrum Master | Manu |
| Product Owner | Matthew |
| Backend Developer | Gonzalo |
| Frontend Developer | Enrique |
| Database Engineer | Elias |
| Testing & QA | Maximiliano |

**Objectives:**
- Complete team management functionality
- Implement player and team deletion with cascade
- Add schedule/calendar features
- Build functional analytics pages

**Deliverables:**
- ✅ **Teams API** with full CRUD operations
- ✅ **Create Team** functionality with custom colors
- ✅ **Delete Team** with cascade delete (removes associated players, sessions, stats, schedules)
- ✅ **Delete Player** functionality working correctly
- ✅ **Add Player** modal with photo upload support
- ✅ **Match Schedule API** for managing events
- ✅ **Schedule Page** with:
  - Manual event creation (matches & training)
  - Google Calendar export (.ics file)
  - Event filtering by team
- ✅ **Training Load Page** fully functional with:
  - Bar charts showing player load scores
  - Pie charts for load distribution
  - Summary cards (total players, avg load, optimal/high load counts)
  - Detailed player table with status indicators
- ✅ **Injury Risk Page** fully functional with:
  - Risk score visualization
  - Risk distribution charts
  - Individual player risk cards with recommendations
  - High-risk player alerts
- ✅ Foreign key constraint fixes for proper cascade deletion
- ✅ SQL GROUP BY compatibility fixes for Azure SQL (TEXT columns)

**Technical Highlights:**
- Chart.js integration for data visualization
- Complex SQL queries for analytics aggregation
- Cascade delete logic handling multiple foreign key relationships
- Azure SQL-specific query optimizations (removing TEXT from GROUP BY)

---

### 🏃 Sprint 4: ML Model & UI Polish
**Dates:** December 9-12, 2024

**Roles:**
| Role | Team Member |
|------|-------------|
| Scrum Master | Elias |
| Product Owner | Manu |
| ML Engineer | Enrique |
| Backend Developer | Maximiliano |
| Frontend Developer | Gonzalo |
| Testing & QA | Matthew |

**Objectives:**
- Implement machine learning injury prediction model
- Polish UI with animations and effects
- Add AI-powered recommendations to dashboard
- Final bug fixes and deployment

**Deliverables:**
- ✅ **ML Injury Prediction Model:**
  - Random Forest classifier trained on player metrics
  - Features: age, training minutes, heart rate, distance, sprint count, session frequency
  - Predicts injury probability with risk categorization (Low/Medium/High)
  - Model trained on synthetic data with realistic distributions
  - Accessible via `/analytics/ml-injury-prediction` endpoint
- ✅ **ML Predictions Page** with:
  - Model accuracy and performance metrics
  - Feature importance visualization
  - Individual player predictions with confidence scores
  - Actionable recommendations based on predictions
- ✅ **Dashboard Enhancements:**
  - "Next Match" scoreboard widget showing upcoming opponent
  - AI Recommendations panel with recovery, injury, and workload suggestions
  - Shiny text animation on "Performance Overview" title
- ✅ **Loading Animations:**
  - Custom speeder/rocket loading animation
  - Shows on add player and add team actions
  - Smooth page transitions
- ✅ **Analytics Navigation:**
  - Collapsible Analytics submenu with chevron toggle
  - Training Load and Injury Risk as expandable sub-tabs
- ✅ **Bug Fixes:**
  - Fixed chart container stretching issues
  - Fixed AI recommendations showing "undefined" text
  - Fixed analytics toggle expand/collapse behavior
- ✅ **CI/CD Improvements:**
  - ZIP package deployment for Azure
  - Startup command configuration via Azure CLI
  - Improved deployment reliability

**Technical Highlights:**
- Scikit-learn Random Forest model with hyperparameter tuning
- Model persistence and prediction API endpoint
- Real-time feature extraction from database
- CSS animations (keyframes) for visual polish
- Chart.js with fixed container heights for consistent rendering

---

## Project Goal

The Football Performance Dashboard aims to provide coaches and sports scientists with a comprehensive platform to:

- **Track player performance** across training sessions and matches
- **Monitor workload** to prevent overtraining and reduce injury risk
- **Analyze statistics** to optimize training programs
- **Store and retrieve** player data securely using Azure SQL Database
- **Gain insights** through Application Insights monitoring and analytics

## Minimum Viable Product (MVP)

The MVP includes:

- RESTful API built with FastAPI (Python)
- CRUD operations for players (`/players`)
- CRUD operations for training sessions (`/sessions`)
- CRUD operations for session statistics (`/stats`)
- Health check endpoint (`/health`)
- Azure SQL Database integration
- Application Insights monitoring
- CI/CD pipeline with GitHub Actions
- Interactive API documentation (Swagger UI)

## Architecture Diagram

```
+-----------------------------------------------------------------------------+
|                           Architecture Overview                              |
+-----------------------------------------------------------------------------+
|                                                                             |
|   +--------------+     +------------------+     +--------------------+      |
|   |   Clients    |---->|  Azure App       |---->|  Azure SQL         |      |
|   | (Web/Mobile) |     |  Service         |     |  Database          |      |
|   +--------------+     |  (FastAPI)       |     |                    |      |
|                        +--------+---------+     +--------------------+      |
|                                 |                                           |
|                                 v                                           |
|                        +------------------+                                 |
|                        |  Application     |                                 |
|                        |  Insights        |                                 |
|                        |  (Monitoring)    |                                 |
|                        +------------------+                                 |
|                                                                             |
+-----------------------------------------------------------------------------+
|                        CI/CD Pipeline (GitHub Actions)                       |
|   +---------+     +---------+     +---------+                               |
|   |  Build  |---->|  Test   |---->| Deploy  |                               |
|   +---------+     +---------+     +---------+                               |
+-----------------------------------------------------------------------------+
```

## API Endpoints

### Core Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information |
| GET | `/health` | Health check status |

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login and get JWT token |

### Players
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/players` | List all players |
| POST | `/players` | Create a new player |
| GET | `/players/{id}` | Get player by ID |
| PUT | `/players/{id}` | Update player |
| DELETE | `/players/{id}` | Delete player |

### Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teams` | List all teams |
| POST | `/teams` | Create a new team |
| GET | `/teams/{id}` | Get team by ID |
| PUT | `/teams/{id}` | Update team |
| DELETE | `/teams/{id}` | Delete team |

### Training Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sessions` | List all training sessions |
| POST | `/sessions` | Create a training session |
| GET | `/sessions/{id}` | Get session by ID |
| PUT | `/sessions/{id}` | Update session |
| DELETE | `/sessions/{id}` | Delete session |

### Session Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | List all session statistics |
| POST | `/stats` | Create session statistics |
| GET | `/stats/{id}` | Get statistics by ID |
| PUT | `/stats/{id}` | Update statistics |
| DELETE | `/stats/{id}` | Delete statistics |

### Match Schedule
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/schedule` | List all scheduled events (supports filters) |
| POST | `/schedule` | Create a new event |
| GET | `/schedule/{id}` | Get event by ID |
| PUT | `/schedule/{id}` | Update event |
| DELETE | `/schedule/{id}` | Delete event |

### Analytics (NEW in Sprint 2)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/training-load` | Get training load analysis for all players |
| GET | `/analytics/injury-risk` | Get injury risk assessment for all players |
| GET | `/analytics/insights` | Get comprehensive insights and recommendations |

## Setup Steps

### Prerequisites

- Python 3.11+
- Azure SQL Database (for production)
- Azure App Service (for deployment)
- Application Insights (for monitoring)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/football-performance-dashboard.git
   cd football-performance-dashboard
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set environment variables** (create a `.env` file)
   ```env
   # For local development (SQLite)
   DATABASE_URL=sqlite:///./test.db
   
   # For Azure SQL Database
   AZURE_SQL_SERVER=your-server.database.windows.net
   AZURE_SQL_DATABASE=your-database
   AZURE_SQL_USERNAME=your-username
   AZURE_SQL_PASSWORD=your-password
   
   # Application Insights (optional for local)
   APPLICATIONINSIGHTS_CONNECTION_STRING=your-connection-string
   
   # CORS settings (comma-separated list, defaults to * if not set)
   CORS_ALLOWED_ORIGINS=https://your-frontend.com,https://localhost:3000
   ```

5. **Run the application**
   ```bash
   uvicorn app.main:app --reload
   ```

6. **Access the API**
   - API: http://localhost:8000
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

### Demo / Test Account
- Preloaded coach account with sample data:
  - Username: `demo_coach`
  - Password: `Coach1234`
- Use this account to log in via the UI or `/auth/login` and explore teams, players, sessions, analytics, and schedule data without setting up your own records.

### Running Tests

```bash
pytest tests/ -v
```

### Azure Deployment

1. **Create Azure Resources**
   - Create an Azure SQL Database
   - Create an Azure App Service (Python 3.11)
   - Create Application Insights

2. **Configure GitHub Secrets**
   - `AZURE_WEBAPP_NAME`: Your App Service name
   - `AZURE_WEBAPP_PUBLISH_PROFILE`: Download from Azure Portal

3. **Configure App Service Settings**
   - Add environment variables for database connection
   - Add Application Insights connection string

4. **Deploy**
   - Push to `main` branch to trigger automatic deployment

## Project Structure

```
football-performance-dashboard/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── db/
│   │   ├── __init__.py
│   │   └── database.py      # Database connection
│   ├── models/
│   │   ├── __init__.py
│   │   └── models.py        # SQLAlchemy models (Player, Team, Schedule, etc.)
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication router
│   │   ├── health.py        # Health check router
│   │   ├── players.py       # Players CRUD router
│   │   ├── teams.py         # Teams CRUD router (NEW)
│   │   ├── sessions.py      # Sessions CRUD router
│   │   ├── stats.py         # Stats CRUD router
│   │   ├── schedule.py      # Match/Training schedule router (NEW)
│   │   └── analytics.py     # Analytics & insights router (NEW)
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── schemas.py       # Pydantic schemas
│   ├── static/
│   │   ├── index.html       # Frontend HTML
│   │   └── js/
│   │       ├── app.js       # Original JavaScript
│   │       └── app-enhanced.js  # Enhanced utilities (NEW)
│   └── utils/
│       └── auth.py          # Authentication utilities
├── frontend/                # React setup (NEW)
│   └── package.json         # Frontend dependencies
├── tests/
│   ├── __init__.py
│   └── test_api.py          # API tests
├── .github/
│   └── workflows/
│       └── ci-cd.yml        # CI/CD pipeline
├── UPGRADE_IMPLEMENTATION_PLAN.md  # Implementation guide (NEW)
├── requirements.txt         # Python dependencies
└── README.md               # Project documentation
```

## Technologies Used

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **Pydantic** - Data validation
- **Scikit-learn** - Machine learning (Random Forest)
- **Chart.js** - Data visualization
- **Tailwind CSS** - UI styling
- **Azure SQL Database** - Cloud database
- **Azure App Service** - Application hosting
- **Application Insights** - Monitoring and analytics
- **GitHub Actions** - CI/CD automation
- **pytest** - Testing framework

---

## Product Backlog

**Priority 1 (MVP - Completed ✅):**
- ✅ As a coach, I want to add player profiles so I can track their information
- ✅ As a coach, I want to create training sessions so I can record workouts
- ✅ As a coach, I want to log session statistics so I can monitor player workload
- ✅ As a coach, I want to view all players so I can see my roster
- ✅ As a system, I want health checks so Azure can monitor uptime
- ✅ As a coach, I want to create and manage teams
- ✅ As a coach, I want to delete players and teams

**Priority 2 (Completed ✅):**
- ✅ As a coach, I want to see workload charts so I can prevent injuries
- ✅ As a coach, I want to see injury risk analysis for my players
- ✅ As a coach, I want to schedule matches and training sessions
- ✅ As a coach, I want AI recommendations for player recovery
- ✅ As a coach, I want ML-powered injury predictions

**Priority 3 (Completed ✅):**
- ✅ As a coach, I want injury prediction alerts based on ML models
- ✅ As a system, I want authentication and authorization (JWT)
- ✅ As a coach, I want to export data (PDF reports, Google Calendar)

---

## Definition of Done

A user story is considered "Done" when:
- [x] Code is written and follows PEP 8 standards
- [x] Unit tests are written and passing
- [x] API endpoint is documented in Swagger
- [x] Code is reviewed by at least one team member
- [x] Changes are merged to main branch
- [x] Deployed successfully to Azure App Service
- [x] Tested in production environment
- [x] Product Owner has accepted the feature

---

## Sprint Schedule Summary

| Sprint | Dates | Focus | Scrum Master | Product Owner |
|--------|-------|-------|--------------|---------------|
| Sprint 1 | Nov 30 - Dec 1 | Azure Infrastructure & Deployment | Gonzalo | Enrique |
| Sprint 2 | Dec 2-3 | Core Features & UI Foundation | Maximiliano | Gonzalo |
| Sprint 3 | Dec 4-8 | Full CRUD & Team Management | Manu | Matthew |
| Sprint 4 | Dec 9-12 | ML Model & UI Polish | Elias | Manu |

---

## License

MIT License
