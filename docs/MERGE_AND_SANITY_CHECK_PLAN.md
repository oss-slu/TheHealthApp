# Merge order + sanity checks (PRs #111 → #110)

Use this when integrating **#111, #107, #108, #109, #110** into `main`. **Merging happens on GitHub** (repo maintainers only); this file is the runbook and local verification steps.

**Hard rule:** merge **#110 only after #109** (CORS after Framingham API work).

---

## 1. Principles

- **Order matters** for **#110 after #109** (per PR #110 title).
- **Foundational PRs** (CI, Docker/DB) first so later changes are tested in the same environment.
- After each merge, **`main` moves** — open PRs may need **“Update branch”** on GitHub (merge `main` into the PR branch) before the next merge.
- **Green CI** is necessary but not sufficient — run a **short local pass** after each merge (or at least after the last one).

---

## 2. Recommended merge order (GitHub)

| Step | PR | Rationale |
|------|----|-----------|
| 1 | **#111** – CI workflow | Puts **GitHub Actions** on `main` so later merges trigger automated checks. |
| 2 | **#107** – Docker + Mongo auth | Stabilizes **local/compose** and **DB** for testing the rest. |
| 3 | **#108** – Disable demo mode | Config/behavior; small surface. |
| 4 | **#109** – Framingham risk API integration | **Required before #110.** |
| 5 | **#110** – CORS + allowed origins | **After #109** so CORS matches final API/frontend wiring. |

**If a PR conflicts** after an earlier merge: **stop**; author updates the PR branch from `main`, resolves, pushes, CI green — then continue.

---

## 3. After each merge — quick local pass

From a **clean** `main` after `git pull`:

```bash
git fetch origin && git checkout main && git pull
```

### Frontend (`frontend/`)

```bash
cd frontend
npm install
npm run lint
npm run test:run
npm run build
```

### Backend (`backend/`)

No project `pytest` suite in-tree at time of writing; if CI (after #111) runs backend tests or lint, match that command here.

**Smoke (optional, ~2 min):** start API with a configured `backend/.env` and MongoDB reachable, then `GET /healthz` (e.g. `http://127.0.0.1:8000/healthz`).

---

## 4. Targeted checks per PR

| PR | What to verify |
|----|----------------|
| **#111** | **Actions** tab: workflow run on the merge commit to `main`. |
| **#107** | `docker compose` (or README instructions) **up**; backend reaches Mongo with documented `MONGO_URL` / auth. |
| **#108** | Demo / mock disabled as intended; no mock-only paths in critical user flows. |
| **#109** | `POST /api/v1/health/risk-assessment` (auth + consent) returns **200** with valid body; product rules for consent unchanged. |
| **#110** | Browser: **no CORS errors** for API calls from your dev origin (`http://localhost:5173` and `http://127.0.0.1:5173` or whatever is in `ALLOWED_ORIGINS`); login, consent, Framingham still work. |

Log **merger + date** in team chat or release notes.

---

## 5. Final E2E after all five on `main`

| Area | Check |
|------|--------|
| **Auth** | Signup, login, logout, refresh if used. |
| **Consent** | New or reset consent path → then dashboard/questionnaire/modules. |
| **Health** | Framingham (or #109) flow end-to-end; no unintended demo fallbacks. |
| **CORS** | Every dev URL you use is in backend **allowed origins**. |
| **Docker** | Optional: build/run per post-#107 docs. |
| **CI** | Latest **main** run is **green** in Actions. |

Regressions: **new branch from `main` → PR** — do not hotfix `main` without review.

---

## 6. `fix/fullstack-critical-issues` vs `main`

After all merges, **`main` should include** that work **plus** these PRs. If unsure: compare **`main`** to **`fix/fullstack-critical-issues`**; diff should be empty or only trivial, else open a follow-up PR for leftovers.

---

## 7. Checklist (copy when merging)

```
[ ] #111 merged → CI runs on main
[ ] #107 merged → docker/Mongo works per docs
[ ] #108 merged → demo off, smoke test
[ ] #109 merged → Framingham/API path OK
[ ] #110 merged AFTER #109 → no CORS errors, E2E
[ ] Final E2E on main + CI green
```

---

## 8. One-line local smoke (PowerShell, Windows)

**Frontend** (from repo root):

```powershell
Set-Location frontend; npm run test:run; npm run build
```

**Backend health** (with server running):

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/healthz"
```

Expected JSON includes `success: true` and `status: ok`.
