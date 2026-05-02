from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


class PassRateStats(BaseModel):
    total_runs: int
    passed_runs: int
    failed_runs: int
    pass_rate: float


class TestStats(BaseModel):
    total_tests: int
    passed_tests: int
    failed_tests: int
    skipped_tests: int


@router.get("/projects/{project_id}/stats", response_model=PassRateStats)
async def get_project_stats(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get pass rate statistics for a project."""
    # TODO Faza 4: Implement statistics collection
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Statistics endpoint not implemented yet"
    )


@router.get("/suites/{suite_id}/stats", response_model=PassRateStats)
async def get_suite_stats(
    suite_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get pass rate statistics for a test suite."""
    # TODO Faza 4: Implement statistics collection
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Statistics endpoint not implemented yet"
    )

