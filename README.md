# TheHealthApp

## Enterprise-Grade Multilingual Preventive Health Platform

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

### 1. Clone Repository

```bash
git clone https://github.com/oss-slu/TheHealthApp.git
cd TheHealthApp
```

### 2. Start Database (Docker)

```bash
docker run --name tha-mongo -p 27017:27017 -d mongo:7
```

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
```

Configure environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGO_DB_NAME` | Database name | `healthapp` |
| `JWT_ACCESS_SECRET` | Access token secret | (set a strong random value) |
| `JWT_REFRESH_SECRET` | Refresh token secret | (set a different strong random value) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `7` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:5173` |

Run backend:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=$(pwd) uvicorn src.main:app --reload --port 8000
```

API docs:
[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 4. Frontend Setup

```bash
cd frontend
cp .env.example .env
```

Set:

| Variable | Example |
|----------|---------|
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` |
| `VITE_ML_API_URL` | `http://localhost:8001/predict` |

Run:

```bash
npm install
npm run dev
```

Open:
[http://localhost:5173](http://localhost:5173)

---

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
- TBD
---

## Contact

Project Lead: Munazzah Rakhangi
Email: [munazzahrizwan.rakhangi@slu.edu](mailto:munazzahrizwan.rakhangi@slu.edu)

