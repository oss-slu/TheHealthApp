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

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   
pip install -r requirements.txt
cp .env.example .env   
```

**Sample `.env`**

```bash
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=db_Name
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
ALLOWED_ORIGINS=http://localhost:5173
```

Run API:

```bash
PYTHONPATH=$(pwd) uvicorn src.main:app --reload --port 8000
```

Open: **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

---

### 4️⃣ Frontend Setup

```bash
cd ../frontend
cp .env.example .env
VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

Visit: **[http://localhost:5173](http://localhost:5173)**

---

### 5️⃣ ML Service Setup

```bash
TBA
```

---

## 🔌 Integration Variables

| Service    | Variable       | Example                 |
| ---------- | -------------- | ----------------------- |
| Backend    | `ML_API_BASE`  | `http://localhost:8500` |
| Frontend   | `VITE_API_URL` | `http://localhost:8000` |

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
