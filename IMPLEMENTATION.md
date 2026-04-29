# TestManager — Plan de Implementare

> **Ultima actualizare:** 2026-04-29  
> **Status general:** 🟡 În progres — Faza 1

---

## Arhitectură

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (SPA)                       │
│        React + TypeScript + TailwindCSS + Recharts       │
└───────────────────────┬─────────────────────────────────┘
                        │ REST / WebSocket
┌───────────────────────▼─────────────────────────────────┐
│                   Backend API (FastAPI)                  │
│     Auth │ Test Runner │ Scheduler │ Reports │ MCP       │
└────┬──────────────┬────────────────┬────────────────────┘
     │              │                │
┌────▼───┐   ┌──────▼──────┐  ┌─────▼──────┐
│Postgres│   │Celery+Redis │  │ MCP Client │
│        │   │(job queue)  │  │→ GitHub/   │
│        │   │             │  │  GitLab    │
└────────┘   └─────────────┘  └────────────┘
```

---

## Stack Tehnologic

| Layer      | Tehnologie                  | Status     |
|------------|-----------------------------|------------|
| Frontend   | React 18 + TypeScript       | ⬜ Nepornit |
| UI         | TailwindCSS + shadcn/ui     | ⬜ Nepornit |
| Grafice    | Recharts                    | ⬜ Nepornit |
| Backend    | FastAPI (Python 3.12)       | ⬜ Nepornit |
| Queue      | Celery + Redis              | ⬜ Nepornit |
| DB         | PostgreSQL + SQLAlchemy     | ⬜ Nepornit |
| Containere | Docker + Docker SDK         | ⬜ Nepornit |
| Auth       | JWT (python-jose)           | ⬜ Nepornit |
| MCP        | GitHub MCP Server           | ⬜ Nepornit |

---

## Faze de Implementare

---

### ✅ FAZA 0 — Setup Proiect Local
> Obiectiv: Structură monorepo, fișiere de configurare de bază.

| # | Task | Status | Note |
|---|------|--------|------|
| 0.1 | Creare structură foldere monorepo | ✅ Done | `backend/`, `frontend/` |
| 0.2 | Creare `IMPLEMENTATION.md` | ✅ Done | Acest fișier |
| 0.3 | Inițializare backend FastAPI (pyproject.toml, venv) | ✅ Done | |
| 0.4 | Inițializare frontend React + TypeScript (Vite) | ✅ Done | |
| 0.5 | Creare `docker-compose.yml` (Postgres + Redis) | ✅ Done | |
| 0.6 | Creare `.gitignore` | ✅ Done | |
| 0.7 | Inițializare repository Git local | ✅ Done | |

---

### 🟡 FAZA 1 — Fundație Backend
> Obiectiv: API funcțional cu autentificare, modele DB și conexiune GIT via MCP.

| # | Task | Status | Note |
|---|------|--------|------|
| 1.1 | Configurare SQLAlchemy + Alembic (migrații) | ⬜ Nepornit | |
| 1.2 | Modele DB: `User`, `Project`, `TestSuite`, `TestRun`, `TestResult` | ⬜ Nepornit | |
| 1.3 | Endpoint autentificare JWT (`/auth/login`, `/auth/refresh`) | ⬜ Nepornit | |
| 1.4 | CRUD Proiecte (conectare repo GIT) | ⬜ Nepornit | |
| 1.5 | Integrare MCP Client → GitHub (clone/pull/list repos) | ⬜ Nepornit | |
| 1.6 | Endpoint listare branch-uri / tag-uri repo | ⬜ Nepornit | |
| 1.7 | Scriere teste unitare pentru API | ⬜ Nepornit | |

---

### ⬜ FAZA 2 — Test Runner Engine
> Obiectiv: Execuție teste în Docker, captură rezultate, streaming log-uri.

| # | Task | Status | Note |
|---|------|--------|------|
| 2.1 | Docker SDK — creare container efemer per run | ⬜ Nepornit | Izolare completă |
| 2.2 | Detectare automată framework (pytest / Playwright / Cypress / JUnit / Robot) | ⬜ Nepornit | |
| 2.3 | Execuție și captură output (stdout/stderr) | ⬜ Nepornit | |
| 2.4 | Parsare rezultate JUnit XML → TestResult DB | ⬜ Nepornit | |
| 2.5 | WebSocket streaming log-uri live către frontend | ⬜ Nepornit | |
| 2.6 | Stocare artefacte (HTML report, XML) | ⬜ Nepornit | |
| 2.7 | Celery task pentru runs asincrone | ⬜ Nepornit | |

---

### ⬜ FAZA 3 — Frontend & Management
> Obiectiv: Dashboard, vizualizare runs, configurare proiecte.

| # | Task | Status | Note |
|---|------|--------|------|
| 3.1 | Setup Vite + TailwindCSS + shadcn/ui | ⬜ Nepornit | |
| 3.2 | Pagina Login + gestionare token JWT | ⬜ Nepornit | |
| 3.3 | Dashboard overview (stats sumare) | ⬜ Nepornit | |
| 3.4 | Pagina Proiecte (CRUD + conectare repo) | ⬜ Nepornit | |
| 3.5 | Pagina Test Runs (listă, filtru, detalii) | ⬜ Nepornit | |
| 3.6 | Vizualizare live log-uri (WebSocket) | ⬜ Nepornit | |
| 3.7 | Detalii test case (passed/failed/skipped + stack trace) | ⬜ Nepornit | |
| 3.8 | Configurare Scheduler (cron jobs per suite) | ⬜ Nepornit | |

---

### ⬜ FAZA 4 — Raportare Avansată
> Obiectiv: Grafice trend, identificare teste flaky, export rapoarte.

| # | Task | Status | Note |
|---|------|--------|------|
| 4.1 | Grafic pass rate % pe perioadă (Recharts) | ⬜ Nepornit | |
| 4.2 | Grafic durată medie execuție | ⬜ Nepornit | |
| 4.3 | Top N teste flaky (eșuează intermitent) | ⬜ Nepornit | |
| 4.4 | Comparație runs (diff rezultate) | ⬜ Nepornit | |
| 4.5 | Export PDF raport | ⬜ Nepornit | |
| 4.6 | Export CSV rezultate | ⬜ Nepornit | |
| 4.7 | Notificări email la eșecuri | ⬜ Nepornit | |
| 4.8 | Notificări Slack (webhook) | ⬜ Nepornit | |

---

### ⬜ FAZA 5 — CI/CD & Webhooks
> Obiectiv: Triggere automate, badge-uri status, API public.

| # | Task | Status | Note |
|---|------|--------|------|
| 5.1 | Webhook GitHub/GitLab → trigger run automat la push/PR | ⬜ Nepornit | |
| 5.2 | Badge-uri status (SVG endpoint) | ⬜ Nepornit | |
| 5.3 | API public documentat (Swagger/OpenAPI) | ⬜ Nepornit | |
| 5.4 | GitHub Actions workflow pentru CI | ⬜ Nepornit | |
| 5.5 | Docker Compose pentru deploy producție | ⬜ Nepornit | |

---

## Schema Bază de Date

```sql
projects     → id, name, git_repo_url, git_provider, framework, config_json, created_at
test_suites  → id, project_id, name, tags, cron_expression
test_runs    → id, suite_id, status, branch, commit_sha, started_at, finished_at, triggered_by
test_results → id, run_id, test_name, class_name, status, duration_ms, error_message, stack_trace
artifacts    → id, run_id, file_path, file_type (log/html/xml), created_at
schedules    → id, suite_id, cron_expression, active, last_run_at
users        → id, email, hashed_password, role (admin/developer/viewer), created_at
```

---

## Structură Proiect

```
testmanager/
├── IMPLEMENTATION.md         ← acest fișier
├── docker-compose.yml        ← Postgres + Redis + (opțional) backend
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── app/
│   │   ├── main.py
│   │   ├── core/             ← config, security, settings
│   │   ├── api/v1/endpoints/ ← routes
│   │   ├── db/               ← session, base
│   │   ├── models/           ← SQLAlchemy models
│   │   ├── schemas/          ← Pydantic schemas
│   │   ├── services/         ← business logic
│   │   └── workers/          ← Celery tasks
│   └── tests/
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    └── src/
        ├── components/
        │   ├── ui/
        │   ├── charts/
        │   └── layout/
        ├── pages/
        ├── hooks/
        ├── services/         ← API calls
        ├── store/            ← Zustand state
        └── types/
```

---

## Note & Decizii Tehnice

- **Docker izolat per run** → securitate (fără acces la host), resurse limitate (CPU/RAM)
- **JWT cu refresh token** → stateless, scalabil
- **Celery + Redis** → runs asincrone, nu blochează API-ul
- **Alembic** → migrații DB versionare
- **Pydantic v2** → validare strictă input/output API
- **Secrets** → doar în `.env` (niciodată în cod sau git)
