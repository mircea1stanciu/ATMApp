from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.endpoints import auth, projects, suites, runs, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    yield
    # shutdown


app = FastAPI(
    title="TestManager API",
    version="0.1.0",
    description="API pentru managementul rulărilor de teste automate",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(suites.router, prefix="/api/v1/suites", tags=["suites"])
app.include_router(runs.router, prefix="/api/v1/runs", tags=["runs"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
