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

MIT License © TheHealthApp Team
Refer to `LICENSE` for details.

---

## Contact

Project Lead: Munazzah Rakhangi
Email: [munazzahrizwan.rakhangi@slu.edu](mailto:munazzahrizwan.rakhangi@slu.edu)

# 🏥 TheHealthApp

**TheHealthApp** is a multilingual preventive-health platform that bridges the gap between technology, language, and health equity. It empowers individuals from culturally and linguistically diverse communities to better understand their health risks and make informed lifestyle choices — regardless of the language they speak or where they live.

TheHealthApp integrates a modern full-stack architecture — FastAPI backend, React frontend, and a modular ML engine — to deliver personalized health screening experiences accessible in English, Hindi, and Arabic (with more languages planned).

Our vision is simple yet ambitious:

🩺 To make preventive health awareness universal, inclusive, and understandable.

---

## 🌍 Overview  

TheHealthApp helps people perform quick health self-assessments and view instant insights in their preferred language.  
Key highlights:  

- 🔐 **JWT-based authentication** (signup, login, refresh, logout)  
- 🗣️ **Multilingual UI** – English, Hindi, Arabic (more coming)  
- ⚙️ **Modular architecture** (frontend ↔ backend ↔ ML service)  
- 🧠 **ML integration** for real-time risk prediction  
- 🐳 **Docker support** for reproducible local setup  
- 🧩 **Open-source community focus** with contributor-friendly docs  

---

## ⚙️ Tech Stack  

### Frontend  
| Library / Tool | Purpose |
|----------------|----------|
| **React (Vite)** | SPA framework |
| **Tailwind + ShadCN/UI** | Styling and reusable components |
| **i18next** | Internationalization |
| **Axios** | API communication |
| **React Router DOM** | Navigation |
| **Context API** | Auth + global state |

### Backend  
| Library / Tool | Purpose |
|----------------|----------|
| **FastAPI (Python 3.11)** | ASGI backend |
| **MongoDB 7 + Beanie ODM** | Database layer |
| **Pydantic v2** | Validation & schema models |
| **SlowAPI** | Rate limiting |
| **JWT Auth** | Access + refresh tokens |
| **Uvicorn** | Dev server |

### ML Service  
TBA 


---

## 🚀 Getting Started  

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/oss-slu/TheHealthApp.git
cd TheHealthApp
````

### 2️⃣ Start MongoDB (Using Docker)

```bash
docker run --name tha-mongo -p 27017:27017 -d mongo:7
```

### 3️⃣ Backend Setup

Environment variables are the **single source of truth** for backend configuration. Copy the example file and set real values:

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URL, JWT secrets, and CORS origins.
```

**Required variables** (see `backend/.env.example`):

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGO_DB_NAME` | Database name | `healthapp` |
| `JWT_ACCESS_SECRET` | Secret for access tokens | (generate a strong random value) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | (generate a different strong value) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `7` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:5173` |
| `ALLOWED_ORIGIN_REGEX` | Optional CORS regex | (leave empty or set as needed) |

Then install and run:

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=$(pwd) uvicorn src.main:app --reload --port 8000
```

Open: **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

---

### 4️⃣ Frontend Setup

The **API base URL** is configured via environment variables (single source of truth). Copy the example file and set values:

```bash
cd frontend
cp .env.example .env
# Edit .env: set VITE_API_BASE_URL to your backend API base (e.g. http://localhost:8000/api/v1).
npm install
npm run dev
```

**Key variables** (see `frontend/.env.example`):

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL (no trailing slash) | `http://localhost:8000/api/v1` |
| `VITE_ML_API_URL` | ML prediction service URL (for Heart Risk module) | `http://localhost:8001/predict` |

Visit: **[http://localhost:5173](http://localhost:5173)**

---

### 5️⃣ ML Service Setup

```bash
TBA
```

---

## 🔌 Integration Variables

| Service    | Variable           | Purpose                    | Example                        |
| ---------- | ------------------ | -------------------------- | ------------------------------ |
| Frontend   | `VITE_API_BASE_URL`| Backend API base URL       | `http://localhost:8000/api/v1` |
| Frontend   | `VITE_ML_API_URL`  | ML prediction endpoint     | `http://localhost:8001/predict` |
| Backend    | `ALLOWED_ORIGINS`  | CORS allowed frontend URLs | `http://localhost:5173`        |

---

## 🧪 Quick Test Checklist

| Action              | Expected Result                          |
| ------------------- | ---------------------------------------- |
| **Signup/Login**    | JWT tokens stored, redirect to Dashboard |
| **Token Refresh**   | Access token auto-refreshed              |
| **Language Switch** | UI text updates instantly                |
| **Logout**          | Tokens cleared, redirected to Login      |

---

## 🧰 Common Commands

| Task                | Command                                     |
| ------------------- | ------------------------------------------- |
| Start MongoDB       | `docker start tha-mongo`                    |
| Stop MongoDB        | `docker stop tha-mongo`                     |
| Run Backend         | `uvicorn src.main:app --reload --port 8000` |
| Run Frontend        | `npm run dev`                               |
| Format Backend Code | `black src`                                 |
| Lint Frontend       | `npm run lint`                              |

---

## 🤝 Contributing

We love community collaboration!
Please read the upcoming [`CONTRIBUTING.md`](CONTRIBUTING.md) before you open a pull request.

### Quick Guide

```bash
# fork + clone
git clone https://github.com/YOUR_USERNAME/TheHealthApp.git
cd TheHealthApp
git checkout -b feat/your-feature
# commit + push
git commit -m "feat: describe change"
git push origin feat/your-feature
```

---

## 🧭 Issue Labels

| Label              | Meaning                             |
| ------------------ | ----------------------------------- |
| `good first issue` | Starter tasks for new contributors  |
| `bug`              | Something isn’t working             |
| `enhancement`      | Feature or performance improvement  |
| `documentation`    | Docs or README updates              |
| `help wanted`      | Assistance needed / open discussion |

---

## 🛣️ Roadmap

* ✅ Frontend–Backend integration (Sprint 3)
* 🚧 ML model deployment & calibration
* 🚧 CI/CD GitHub Actions
* 🧩 Accessibility & RTL testing
* 🌐 Add other languages localization

---

## 💡 Future Community Plans

* Publish setup + contribution video tutorial
* Host first **Open Contributor Session**
* Launch GitHub Discussions for Q&A
* Write technical blogs documenting ML and frontend integration

---

## 📞 Contact / Support 

**Project Lead:** Munazzah Rakhangi 
📧 Email: [munazzahrizwan.rakhangi@slu.edu] 
If you’d like to contribute, open an issue or reach out to me via my email.

---

## 🧾 License

MIT License © 2025 TheHealthApp Team
See [`LICENSE`](LICENSE) for details.

````
