# 🤝 Contributing to TheHealthApp

Thank you for your interest in contributing!  
We welcome developers, designers, data scientists, and public-health enthusiasts to collaborate on building a more inclusive preventive-health platform.

---

## 🧭 Getting Started

1. **Fork** this repository to your own GitHub account.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/TheHealthApp.git
   cd TheHealthApp
    ````

3. Create a new branch for your contribution:

   ```bash
   git checkout -b feat/your-feature-name
   ```

> ⚠️ **Important:** Never commit directly to the `main` branch.
> Always work in a feature branch and submit a Pull Request.

---

## ⚙️ Local Setup

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### ML Service

```bash
TBA
```

Ensure all three services start successfully before testing integration.

---

## 🧩 Issue Workflow

- Browse open issues under **Issues → Filters → good first issue** for beginner-friendly tasks.  
- To propose new work, open a **New Issue** describing:
  - Problem or feature idea  
  - Expected behavior  
  - Suggested approach or screenshot  
- Wait for the **repository maintainer** to approve the work before starting development.  
- ⚠️ Only the **repository maintainer** has permission to review and merge Pull Requests into the `main` branch.

---

## 🧱 Branch Naming Convention

| Type    | Example                 | Description            |
| ------- | ----------------------- | ---------------------- |
| Feature | `feat/login-page`       | New feature            |
| Fix     | `fix/token-refresh`     | Bug fix                |
| Docs    | `docs/update-readme`    | Documentation update   |
| Chore   | `chore/dependency-bump` | Maintenance / refactor |

---

## 🧼 Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>: <short description>

feat: add multilingual toggle to navbar
fix: correct token refresh timeout
docs: add setup instructions
```

---

## 🔁 Pull Request (PR) Process

1. Commit and push your branch:

   ```bash
   git push origin feat/your-feature-name
   ```
2. Open a **Pull Request (PR)** against the `main` branch.
3. In your PR description, include:

   * What you changed
   * Why it matters
   * Screenshots (if applicable)
4. Make sure:

   * ✅ Code is formatted and linted
   * ✅ All services run without errors
   * ✅ No merge conflicts exist
5. A maintainer will review your PR and request any revisions if needed.

> ⚠️ **Do not commit directly to `main`.**
> All contributions must go through a Pull Request and be reviewed before merging.

---

## 🧠 Code Style Guidelines

* **Python:** follow [PEP8](https://peps.python.org/pep-0008/) and use **Black** for formatting.
* **JavaScript/React:** follow ESLint + Prettier rules defined in the project.
* Write clear variable names, comments, and docstrings.
* Keep PRs small and focused — one logical change per PR.

---

## 🏷️ Labels Glossary

| Label              | Description                    |
| ------------------ | ------------------------------ |
| `good first issue` | Starter-friendly task          |
| `help wanted`      | Maintainers request assistance |
| `bug`              | Something isn’t working        |
| `enhancement`      | Feature request or improvement |
| `documentation`    | Docs or README updates         |

---

## 💬 Communication

* **GitHub Discussions:** for questions, feedback, and ideas
* Always be **respectful, inclusive, and supportive** — we’re building a positive community.

## 📜 License

By contributing, you agree that your code and documentation will be released under the repository’s **MIT License**.

```

