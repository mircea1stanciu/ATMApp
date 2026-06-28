from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.endpoints import auth, projects, suites, runs, reports, webhooks, badges
from app.api.v1.endpoints import settings as settings_router
from app.api.v1.endpoints import test_manager as test_manager_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # shutdown


app = FastAPI(
    title="AutomationTestManager (ATM) API",
    version="1.0.0",
    description=(
        "REST API pentru **AutomationTestManager** — platformă de management şi execuţie "
        "a testelor automate.\n\n"
        "## Autentificare\n"
        "Foloseşte **Bearer JWT** obţinut de la `/api/v1/auth/login`.\n\n"
        "## Webhook-uri\n"
        "Endpoint-urile `/api/v1/webhooks/github/{project_id}` şi "
        "`/api/v1/webhooks/gitlab/{project_id}` permit declanşarea automată "
        "a rulărilor la push/PR — nu necesită autentificare, dar verifică semnătura HMAC.\n\n"
        "## Badge-uri\n"
        "Endpoint-ul `/api/v1/badge/project/{project_id}` returnează un SVG "
        "cu statusul ultimului run — poate fi inclus direct în README."
    ),
    openapi_tags=[
        {"name": "auth",      "description": "Autentificare şi managementul utilizatorilor"},
        {"name": "projects",  "description": "Proiecte şi configuraţii"},
        {"name": "suites",    "description": "Suite de teste şi scheduler"},
        {"name": "runs",      "description": "Rulări de teste şi rezultate"},
        {"name": "reports",   "description": "Rapoarte şi statistici"},
        {"name": "webhooks",  "description": "Webhook-uri GitHub / GitLab (public, verificat HMAC)"},
        {"name": "badges",    "description": "Badge-uri SVG pentru status run (public)"},
    ],
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix="/api/v1/auth",      tags=["auth"])
app.include_router(projects.router,  prefix="/api/v1/projects",  tags=["projects"])
app.include_router(suites.router,    prefix="/api/v1/suites",    tags=["suites"])
app.include_router(runs.router,      prefix="/api/v1/runs",      tags=["runs"])
app.include_router(reports.router,   prefix="/api/v1/reports",   tags=["reports"])
app.include_router(webhooks.router,  prefix="/api/v1/webhooks",  tags=["webhooks"])
app.include_router(badges.router,          prefix="/api/v1/badge",     tags=["badges"])
app.include_router(settings_router.router,     prefix="/api/v1/settings",      tags=["settings"])
app.include_router(test_manager_router.router, prefix="/api/v1/test-manager", tags=["test-manager"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
