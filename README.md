# Football Performance Dashboard

A professional trainer dashboard that ingests football athletes' data and transforms it into helpful insights to prevent injury and optimize workload.

---

## Team Structure & Roles

**Sprint 0 Roles:**
- **Enrique** - Scrum Master & Documentation Lead
- **Gonzalo** - Product Owner & Cloud Infrastructure
- **Matthew** - Backend Developer (API Development)
- **Manu** - DevOps Engineer (CI/CD Pipeline)
- **Maximiliano** - Monitoring & Reliability Engineer
- **Elias** - Frontend/UX Developer & Testing

> **Note:** Product Owner and Scrum Master roles will rotate in future sprints to give everyone leadership experience.

### Role Responsibilities

**Product Owner (Gonzalo):**
- Maintain and prioritize product backlog
- Define user stories and acceptance criteria
- Stakeholder communication
- Sprint planning decisions

**Scrum Master (Enrique):**
- Facilitate daily standups and sprint ceremonies
- Remove blockers and impediments
- Ensure Scrum practices are followed
- Document sprint outcomes and retrospectives

**Backend Developer (Matthew):**
- Develop FastAPI REST API
- Implement CRUD operations
- Database schema design and ORM integration
- API endpoint testing

**DevOps Engineer (Manu):**
- Set up CI/CD pipeline with GitHub Actions
- Configure Azure App Service deployment
- Manage environment variables and secrets
- Infrastructure automation

**Monitoring & Reliability Engineer (Maximiliano):**
- Configure Application Insights
- Set up logging and telemetry
- Create monitoring dashboards
- Define health checks and alerts

**Frontend/UX & Testing (Elias):**
- Design user interface (if applicable)
- Write unit and integration tests
- API documentation and testing
- Quality assurance

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

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information |
| GET | `/health` | Health check status |
| GET | `/players` | List all players |
| POST | `/players` | Create a new player |
| GET | `/players/{id}` | Get player by ID |
| PUT | `/players/{id}` | Update player |
| DELETE | `/players/{id}` | Delete player |
| GET | `/sessions` | List all training sessions |
| POST | `/sessions` | Create a training session |
| GET | `/sessions/{id}` | Get session by ID |
| PUT | `/sessions/{id}` | Update session |
| DELETE | `/sessions/{id}` | Delete session |
| GET | `/stats` | List all session statistics |
| POST | `/stats` | Create session statistics |
| GET | `/stats/{id}` | Get statistics by ID |
| PUT | `/stats/{id}` | Update statistics |
| DELETE | `/stats/{id}` | Delete statistics |

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
│   │   └── models.py        # SQLAlchemy models
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── health.py        # Health check router
│   │   ├── players.py       # Players CRUD router
│   │   ├── sessions.py      # Sessions CRUD router
│   │   └── stats.py         # Stats CRUD router
│   └── schemas/
│       ├── __init__.py
│       └── schemas.py       # Pydantic schemas
├── tests/
│   ├── __init__.py
│   └── test_api.py          # API tests
├── .github/
│   └── workflows/
│       └── ci-cd.yml        # CI/CD pipeline
├── requirements.txt         # Python dependencies
└── README.md               # Project documentation
```

## Technologies Used

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **Pydantic** - Data validation
- **Azure SQL Database** - Cloud database
- **Azure App Service** - Application hosting
- **Application Insights** - Monitoring and analytics
- **GitHub Actions** - CI/CD automation
- **pytest** - Testing framework

---

## Sprint 0 Deliverables ✓

**Completed on November 29, 2025**

- ✓ Team formed with 6 members
- ✓ Roles assigned (Product Owner, Scrum Master, Developers)
- ✓ Project idea selected: Football Performance Dashboard
- ✓ GitHub repository created and initialized
- ✓ Product backlog drafted with user stories
- ✓ MVP scope defined (REST API with CRUD operations)
- ✓ Architecture designed (Azure App Service + SQL Database + Application Insights)
- ✓ Technology stack selected (FastAPI, SQLAlchemy, pytest)
- ✓ Project structure created
- ✓ Documentation completed (README with setup instructions)
- ✓ Development environment setup (Python venv)

**Next Sprint:** Sprint 1 - Azure environment setup and initial deployment

---

## Product Backlog (Initial)

**Priority 1 (MVP - Must Have):**
- As a coach, I want to add player profiles so I can track their information
- As a coach, I want to create training sessions so I can record workouts
- As a coach, I want to log session statistics so I can monitor player workload
- As a coach, I want to view all players so I can see my roster
- As a system, I want health checks so Azure can monitor uptime

**Priority 2 (Future Enhancements):**
- As a coach, I want to see workload charts so I can prevent injuries
- As a coach, I want to filter players by position so I can organize training
- As a player, I want to view my own stats so I can track progress
- As a coach, I want to export data to CSV so I can analyze externally

**Priority 3 (Nice to Have):**
- As a coach, I want injury prediction alerts based on workload trends
- As a coach, I want to compare players side-by-side
- As a system admin, I want authentication and authorization

---

## Definition of Done

A user story is considered "Done" when:
- [ ] Code is written and follows PEP 8 standards
- [ ] Unit tests are written and passing (>80% coverage)
- [ ] API endpoint is documented in Swagger
- [ ] Code is reviewed by at least one team member
- [ ] Changes are merged to main branch
- [ ] Deployed successfully to Azure App Service
- [ ] Tested in production environment
- [ ] Product Owner has accepted the feature

---

## Sprint Schedule

| Sprint | Dates | Goals |
|--------|-------|-------|
| Sprint 0 | Nov 27-29 | Team setup, planning, documentation |
| Sprint 1 | Nov 30-Dec 1 | Azure setup, skeleton app deployment |
| Sprint 2 | Dec 2-3 | Core features, database, monitoring |
| Sprint 3 | Dec 4 | Polish, testing, demo preparation |
| **Demo** | **Dec 4, 2025** | **Sprint Review & Presentation** |

---

## License

MIT License
