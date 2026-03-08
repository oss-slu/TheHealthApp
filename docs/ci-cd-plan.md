# CI/CD Plan — TheHealthApp

**Status:** Draft for Tech Lead review  
**Last updated:** 2025-03-07  
**Scope:** Design only — workflows are not implemented yet.

---

## 1. Research: GitHub Actions

### 1.1 What is GitHub Actions?

GitHub Actions is GitHub’s built-in CI/CD platform. Workflows are defined in YAML under `.github/workflows/` and run on GitHub-hosted or self-hosted runners in response to events (push, pull_request, schedule, etc.).

**Concepts:**

| Concept | Description |
|--------|-------------|
| **Workflow** | Top-level YAML file (e.g. `ci.yml`) that defines when and what runs. |
| **Job** | Set of steps that run on the same runner. Jobs can depend on each other and run in parallel when independent. |
| **Step** | Single task (run a script, use an action, etc.). |
| **Action** | Reusable unit (e.g. `actions/checkout`, `actions/setup-node`). |
| **Runner** | VM (e.g. `ubuntu-latest`) or self-hosted machine that executes jobs. |

### 1.2 Triggers and events

- **`pull_request`** — On PR open, sync, or reopen. Used for PR checks (lint, test, build).
- **`push`** — On push to a branch. Typically used for:
  - **`push: branches: [main]`** — Post-merge checks and/or deploy.
  - **`push: tags: ['v*']`** — Release builds or publish.
- **`workflow_dispatch`** — Manual run from the Actions tab (useful for deploy or one-off checks).

### 1.3 Practices relevant to this project

- **Path filters:** Use `paths` / `paths-ignore` so only affected jobs run (e.g. frontend changes → frontend job only).
- **Caching:** Cache `node_modules` (frontend) and `pip` (backend) to speed up runs.
- **Secrets:** Use GitHub Secrets (e.g. `MONGODB_URI`, `JWT_*`) for tests or deploy; never commit secrets.
- **Concurrency:** Use `concurrency` so only the latest run per branch/PR is relevant (cancel in-progress runs on new push).
- **Matrix (optional):** Run frontend tests on multiple Node versions if we want broader compatibility.

---

## 2. Checks: PR vs Merge

### 2.1 Principle

- **PR:** All checks that must pass before code is merged (quality and “does it build?”).
- **Merge (post-merge):** Same guarantees plus any deploy or release steps we want only after code is on the default branch.

### 2.2 Checks on Pull Requests

These run on every PR (and optionally on push to PR branch). Goal: block merge if anything fails.

| Check | Scope | Purpose |
|-------|--------|---------|
| **Lint** | Frontend | `npm run lint` (ESLint). Ensures code style and basic correctness. |
| **Lint** | Backend | `black --check src` (or equivalent). Ensures Python formatting. |
| **Test** | Frontend | `npm run test:run` (Vitest). Unit/component tests; no coverage gate initially. |
| **Test** | Backend | Optional: when tests exist (e.g. pytest), run in CI. |
| **Build** | Frontend | `npm run build` (Vite). Ensures the app builds without errors. |
| **Build** | Backend | Optional: `pip install -r requirements.txt` and a quick sanity check (e.g. import main app). |
| **Docker build** | Optional | Build `frontend/Dockerfile` and `backend/Dockerfile` to catch Dockerfile breakage (no push). |

**Path filters (recommended):**

- Frontend job: trigger only when `frontend/**` (or relevant subset) changes.
- Backend job: trigger only when `backend/**` changes.
- Shared/config: run both or a minimal “config” job when `.github/`, root configs, or shared scripts change.

### 2.3 Checks on Merge (push to default branch)

After code is merged (e.g. into `main`):

| Check / Action | Purpose |
|----------------|---------|
| **Same as PR** | Re-run lint, test, build (or rely on PR status and only run changed jobs) to protect the default branch. |
| **Docker build (and optional push)** | Build images for backend/frontend and optionally push to a registry (e.g. GHCR) for deploy. |
| **Deploy (later)** | Optional: deploy to staging/production (e.g. trigger external deploy or use GitHub Environments). |

We do **not** implement deploy in this plan; we only document that merge is the right place for “post-merge only” steps like push to registry or deploy.

### 2.4 Summary table

| Event | Lint | Test | Build | Docker build | Deploy / release |
|-------|------|------|--------|--------------|-------------------|
| **Pull request** | ✅ | ✅ | ✅ | Optional | ❌ |
| **Push to main** | ✅ (or skip if PR already passed) | ✅ | ✅ | ✅ (optional push) | Optional (later) |
| **Tag push (e.g. v*)** | Optional | Optional | ✅ | ✅ | Optional release |

---

## 3. Documented Workflows (design only)

The following workflows are **designed but not yet implemented**. File names and triggers are recommendations.

### 3.1 Workflow: PR / CI checks

**Proposed file:** `.github/workflows/ci.yml`

**Trigger:**  
`pull_request` to default branch (e.g. `main`), and optionally `push` to branches that have an open PR.

**Jobs (high level):**

1. **frontend**
   - Trigger: changes under `frontend/**` (or always if no path filter).
   - Steps: checkout → setup Node (e.g. 20) → cache `node_modules` → `npm ci` → `npm run lint` → `npm run test:run` → `npm run build`.
   - No deploy; no secrets required for this job unless we add E2E later.

2. **backend**
   - Trigger: changes under `backend/**`.
   - Steps: checkout → setup Python (e.g. 3.11) → cache pip → `pip install -r requirements.txt` → lint (e.g. `black --check src`) → optional test command when available.
   - If tests need MongoDB, use a service container or skip in first iteration.

3. **docker (optional)**
   - Trigger: changes under `frontend/**`, `backend/**`, or `*/Dockerfile`.
   - Steps: build `backend` and `frontend` images (no push). Ensures Dockerfiles stay valid.

**Concurrency:** One per branch/PR (cancel in-progress runs on new push).

---

### 3.2 Workflow: Post-merge (main branch)

**Proposed file:** `.github/workflows/build.yml` or extend `ci.yml` with `push: branches: [main]`.

**Trigger:**  
`push` to `main` (or default branch).

**Jobs (high level):**

1. **Same checks as CI** — Either reuse the same job definitions or run lint/test/build again (with path filters to keep duration low).
2. **Docker build and push (optional)** — Build backend and frontend images and push to a registry (e.g. GitHub Container Registry). Use GitHub Secrets for registry auth. Only when we are ready to use a registry.

No deploy step is defined here; that can be a separate workflow or job added after Tech Lead approval.

---

### 3.3 Workflow: Manual / on-demand

**Proposed file:** `.github/workflows/manual.yml` or combined with above.

**Trigger:**  
`workflow_dispatch` (optional inputs: e.g. “run frontend only”, “run full CI”).

**Purpose:** Allow Tech Lead or maintainers to run the same checks or a subset without opening a PR (e.g. after fixing a branch or validating before a release).

---

## 4. Project-specific notes

- **Monorepo:** Frontend (`frontend/`), backend (`backend/`), ML (`ml/`). Path filters keep CI fast and relevant.
- **Frontend:** React (Vite), npm, ESLint, Prettier, Vitest. Commands: `lint`, `test:run`, `build`.
- **Backend:** FastAPI, Python 3.11, Black. Dockerfile present. Tests can be added later and wired into the backend job.
- **ML:** Can be included later (e.g. separate job for `ml/**` when we run training or evaluation in CI).
- **Secrets:** Any workflow that needs DB or external services (or registry push) will use GitHub Secrets; none are required for the initial PR lint/test/build design.

---

## 5. Acceptance and next steps

- [ ] **Tech Lead review:** Review this plan and approve or request changes.
- [ ] **Implement:** After approval, add `.github/workflows/ci.yml` (and optionally `build.yml`, `manual.yml`) per this design.
- [ ] **Branch protection:** Configure branch protection so PRs require the CI workflow to pass before merge.
- [ ] **Secrets and deploy:** When ready, add secrets and optional deploy/release steps without changing the PR vs merge split described above.

---

*This document describes the intended CI/CD design only. No workflows are implemented until explicitly added under `.github/workflows/`.*
