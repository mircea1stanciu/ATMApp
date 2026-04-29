from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # App
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://testmanager:testmanager@localhost:5432/testmanager"

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # GitHub MCP
    GITHUB_TOKEN: str = ""
    GITHUB_MCP_BASE_URL: str = "https://api.github.com"

    # Docker runner
    DOCKER_RUNNER_NETWORK: str = "none"
    DOCKER_RUNNER_MEM_LIMIT: str = "512m"
    DOCKER_RUNNER_CPU_QUOTA: int = 50000  # 50% dintr-un CPU

    # Artifacts storage
    ARTIFACTS_DIR: str = "/tmp/testmanager/artifacts"


settings = Settings()
