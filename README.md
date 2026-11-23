# TheHealthApp

## Multilingual Preventive Health Platform

TheHealthApp is a scalable, modular, multilingual preventive health platform designed to improve accessibility to health risk awareness across diverse populations. The system enables users to perform structured self-assessments and receive interpretable insights through a technology-driven interface.

The platform integrates a modern full-stack architecture combining FastAPI, React, and a modular machine learning layer to deliver real-time, accessible health insights.

---

## Vision

To build a globally accessible preventive healthcare platform that delivers clear, actionable, and language-inclusive health insights, empowering users to make informed lifestyle decisions regardless of geography or language barriers.

---

## Current Product Scope (Milestone 2 – Deployable MVP)

The current release focuses on delivering a fully functional Minimum Viable Product (MVP) with:

- End-to-end user flow (consent → input → result)
- Stable local deployment environment
- Core health risk workflow (initial version)
- Basic CI validation for code reliability

This milestone prioritizes system stability, usability, and integration over feature breadth.

---

## Key Capabilities

### Authentication and Security

- JWT-based authentication (access and refresh tokens)
- Secure login, signup, and logout workflows
- Token lifecycle management

### Multilingual Interface

- Language support: English, Hindi, Arabic
- Real-time UI translation using i18next
- Designed for future localization scalability

### Health Risk Assessment (MVP)

- Structured questionnaire-based input
- Backend-driven risk evaluation logic (initial version)
- Expandable architecture for machine learning-based predictions

### Modular System Architecture

- Decoupled frontend, backend, and ML services
- API-driven communication
- Scalable for future microservice expansion

### Local Deployment (Docker-enabled)

- MongoDB containerized using Docker
- Reproducible development environment
- Simplified onboarding for contributors

### CI/CD (Current Implementation)

- GitHub Actions-based CI workflow
- Automated linting, testing, and build validation
- Foundation for future deployment pipelines

---

## System Architecture Overview

```
Frontend (React)  ->  Backend (FastAPI)  ->  Database (MongoDB)
↓
ML Service (Planned)
```

---

## Technology Stack

### Frontend

| Tool | Purpose |
|------|---------|
| React (Vite) | SPA framework |
| Tailwind + ShadCN/UI | Styling and components |
| i18next | Internationalization |
| Axios | API communication |
| React Router DOM | Navigation |
| Context API | Global state management |

### Backend

| Tool | Purpose |
|------|---------|
| FastAPI (Python 3.11) | Backend API |
| MongoDB 7 | Database |
| Beanie ODM | Data modeling |
| Pydantic v2 | Validation |
| SlowAPI | Rate limiting |
| JWT | Authentication |
| Uvicorn | Server runtime |

### Machine Learning Layer (Planned)

- Risk prediction models (Framingham-based and extended)
- Modular service architecture for ML integration
- API-driven inference system

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Docker** (for MongoDB) or MongoDB 7+ installed locally

### Quick Start (One-Time Setup)

```bash
# 1. Clone the repository
git clone [https://github.com/oss-slu/TheHealthApp.git](https://github.com/oss-slu/TheHealthApp.git)
cd TheHealthApp

# 2. Start MongoDB (Docker - recommended)
docker run --name tha-mongo -p 27017:27017 -d mongo:7

# 3. Setup Backend
cd backend
# Unix (Bash/Zsh):
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate

# Windows (PowerShell):
# Copy-Item .env.example .env
# python -m venv .venv
# .\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
cd ..

# 4. Setup Frontend (in a new terminal)
cd frontend
# Unix (Bash/Zsh): cp .env.example .env
# Windows (PowerShell): Copy-Item .env.example .env
npm install
cd ..
```

### Running the Application

**Terminal 1 - Backend (from `backend/` directory):**

```bash
# Unix (Bash / Zsh):
source .venv/bin/activate
PYTHONPATH=$(pwd) uvicorn src.main:app --reload --port 8000

# Windows (PowerShell):
# .\.venv\Scripts\Activate.ps1
# $env:PYTHONPATH = (Get-Location).Path
# uvicorn src.main:app --reload --port 8000
```

**Terminal 2 - Frontend (from `frontend/` directory):**

```bash
npm run dev
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | [http://localhost:5173](http://localhost:5173) | React application |
| Backend API | [http://localhost:8000/api/v1](http://localhost:8000/api/v1) | FastAPI REST API |
| API Docs | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI |
| Health Check | [http://localhost:8000/healthz](http://localhost:8000/healthz) | Backend health status |

### Environment Variables

#### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGO_DB_NAME` | Database name | `healthapp` |
| `JWT_ACCESS_SECRET` | Access token secret | `dev-access-secret-...` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `dev-refresh-secret-...` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `7` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated); see `backend/.env.example` | Vite `:5173`/`:5174`, `127.0.0.1`, Docker UI `:3000` |

#### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api/v1` |
| `VITE_ML_API_URL` | ML service URL (optional) | `http://localhost:8001/predict` |

### Docker Compose (Alternative)

For running MongoDB with authentication:

```bash
# Set MongoDB password and start services
MONGO_INITDB_ROOT_PASSWORD=your-secret-password docker-compose up -d db

# Update backend/.env to use authenticated connection:
# MONGO_URL=mongodb://userh:your-secret-password@localhost:27017
```

### Smoke Validation Flow

A 4-step manual smoke verification sequence for contributors after initial setup:

1. **Authentication (Auth):**
   - Navigate to `http://localhost:5173/auth/signup` and complete account creation.
   - Verify login at `http://localhost:5173/auth/login` issues valid JWT tokens and transitions state.
2. **Consent & Onboarding:**
   - Verify the onboarding consent prompt renders immediately after first authentication and user acceptance is recorded.
3. **Navigation:**
   - Verify header routing and mobile responsive drawer navigation to `Dashboard`, `Risk Assessment`, and `Settings`.
4. **Health-flow (Dashboard & Risk Assessment):**
   - Access `http://localhost:5173/dashboard` to verify user greeting and default health indicator cards render without errors.
   - Run a risk evaluation flow and verify input acceptance and result rendering.

### Troubleshooting & Diagnostics

#### 1. Setup Failures (Environment & Dependency Issues)

| Symptom | Probable Cause | Action / Resolution |
|---------|----------------|---------------------|
| `Activate.ps1 cannot be loaded because running scripts is disabled` | PowerShell ExecutionPolicy restriction | Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` in PowerShell, then reactivate venv |
| `bash: npm: command not found` | Node.js not installed or PATH missing | Install Node.js 18+ and open a fresh terminal session |
| `ModuleNotFoundError: No module named 'src'` | Python search path (`PYTHONPATH`) not set | In Windows PowerShell: `$env:PYTHONPATH=(Get-Location).Path` / In Unix: `export PYTHONPATH=$(pwd)` |
| `Port 8000 or 5173 already in use` | Zombie or lingering background process | Run uvicorn with alternative port (`--port 8001`) or terminate the conflicting process |

#### 2. Application Failures (Runtime & Service Connectivity)

| Symptom | Probable Cause | Action / Resolution |
|---------|----------------|---------------------|
| `ServerSelectionTimeoutError` / `Connection refused (27017)` | MongoDB container inactive | Verify Docker engine is running (`docker ps`) and start container via `docker start tha-mongo` |
| `Network Error` / `CORS error` in Browser Console | Backend `.env` origins mismatch | Ensure `ALLOWED_ORIGINS` in `backend/.env` includes the frontend origin (`http://localhost:5173`) |
| `401 Unauthorized` on API requests | Invalid or expired JWT signing secrets | Verify `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `backend/.env` and re-authenticate |
| `500 Internal Server Error` on assessment submit | Database schema or collection uninitialized | Check FastAPI traceback logs or inspect endpoint behavior directly in Swagger UI (`http://localhost:8000/docs`) |

## Quick Functional Validation

| Action | Expected Result |
|---------|------------------|
| Signup/Login | JWT tokens generated |
| Token Refresh | Access token refreshed |
| Language Switch | UI updates dynamically |
| Questionnaire | Input accepted |
| Result Display | Risk output generated |
| Logout | Tokens cleared |

---

## Development Workflow

### Branch Strategy

```
main        → Stable release
develop     → Integration branch
feature/*   → Feature development
fix/*       → Bug fixes
ci/*        → CI/CD updates
```

### Commit Convention

```
feat: add risk calculation
fix: resolve API issue
ci: add GitHub Actions workflow
docs: update README
```

---

## CI/CD Strategy (Current State)

CI is implemented using GitHub Actions and runs on:

- Pull requests
- Push to `main` and `develop` branches

### Current Checks

- Lint validation
- Test execution
- Build verification

### Planned Enhancements

- Docker image builds
- Deployment pipelines
- Environment-based releases

---

## Roadmap

### Completed

- Frontend–backend integration
- Authentication system
- Multilingual UI
- MVP health risk workflow

### In Progress

- ML model integration
- CI/CD expansion
- Error handling improvements

### Planned

- Advanced health analytics
- Accessibility improvements
- RTL language support
- Cloud deployment
- Contributor onboarding enhancements

---

## Contribution Guidelines

### Workflow

```bash
git checkout -b feat/your-feature
git commit -m "feat: description"
git push origin feat/your-feature
```

- All changes must go through pull requests
- CI must pass before merging
- Code review is required

---

## Issue Labels

| Label | Meaning |
|-------|---------|
| feature | New functionality |
| bug | Defect or issue |
| enhancement | Improvement |
| documentation | Documentation updates |
| devops | CI/CD or infrastructure |
| help wanted | Open for contribution |

---

## License

This project is licensed under the [MIT License](LICENSE).

Copyright (c) 2026 OSS SLU – TheHealthApp Team.

---

## Contact

Project Lead: Munazzah Rakhangi
Email: [munazzahrizwan.rakhangi@slu.edu](mailto:munazzahrizwan.rakhangi@slu.edu)

