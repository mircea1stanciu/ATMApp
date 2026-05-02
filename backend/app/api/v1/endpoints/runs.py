from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import logging

from app.db.session import get_db
from app.schemas.test_runs import TestRunCreate, TestRunResponse, TestRunDetailsResponse
from app.services.test_run_service import TestRunService
from app.services.test_suite_service import TestSuiteService
from app.services.websocket_manager import connection_manager
from app.workers.tasks import execute_test_run_task
from app.api.v1.endpoints.auth import get_current_user, require_user_or_above

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=TestRunResponse)
async def create_run(
    run_data: TestRunCreate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_user_or_above),
):
    """Create a new test run. Requires Automation User or above."""
    # Verify suite exists
    suite = await TestSuiteService.get_suite(db, str(run_data.suite_id))
    if not suite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test suite not found"
        )
    
    run = await TestRunService.create_run(db, run_data)
    return TestRunResponse.model_validate(run)


@router.get("/{run_id}", response_model=TestRunDetailsResponse)
async def get_run(
    run_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a test run by ID with details."""
    run = await TestRunService.get_run(db, run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test run not found"
        )
    
    details = TestRunDetailsResponse.model_validate(run)
    return details


@router.get("/suites/{suite_id}", response_model=List[TestRunResponse])
async def list_runs_by_suite(
    suite_id: str,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all test runs for a test suite."""
    # Verify suite exists
    suite = await TestSuiteService.get_suite(db, suite_id)
    if not suite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test suite not found"
        )
    
    runs = await TestRunService.list_runs_by_suite(db, suite_id, skip=skip, limit=limit)
    return [TestRunResponse.model_validate(r) for r in runs]


@router.get("/projects/{project_id}", response_model=List[TestRunResponse])
async def list_runs_by_project(
    project_id: str,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all test runs for a project."""
    runs = await TestRunService.list_runs_by_project(db, project_id, skip=skip, limit=limit)
    return [TestRunResponse.model_validate(r) for r in runs]


@router.post("/{run_id}/cancel", response_model=dict)
async def cancel_run(
    run_id: str,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_user_or_above),
):
    """Cancel a pending or running test run."""
    run = await TestRunService.cancel_run(db, run_id)
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test run not found")
    return {"status": "cancelled", "run_id": run_id}


@router.delete("/{run_id}", response_model=dict)
async def delete_run(
    run_id: str,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_user_or_above),
):
    """Delete a test run (cancels first if still running)."""
    # Cancel if active
    await TestRunService.cancel_run(db, run_id)
    deleted = await TestRunService.delete_run(db, run_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test run not found")
    return {"status": "deleted", "run_id": run_id}


@router.post("/{run_id}/execute", response_model=dict)
async def execute_run(
    run_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Execute a test run asynchronously.
    Delegates execution to Celery task queue.
    """
    # Fetch run details
    run = await TestRunService.get_run(db, run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test run not found"
        )
    
    # Get suite and project info
    suite = await TestSuiteService.get_suite(db, str(run.suite_id))
    if not suite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test suite not found"
        )
    
    # Schedule async execution
    task = execute_test_run_task.delay(
        run_id,
        str(run.suite_id),
        str(suite.project_id),
        run.branch or "main",
    )
    
    return {
        "status": "scheduled",
        "run_id": run_id,
        "task_id": task.id,
        "message": f"Test run {run_id} scheduled for execution"
    }


@router.websocket("/ws/{run_id}")
async def websocket_endpoint(websocket: WebSocket, run_id: str):
    """
    WebSocket endpoint for streaming test logs and updates.
    
    Clients connect to /runs/ws/{run_id} to receive real-time:
    - stdout logs
    - stderr logs
    - status updates
    - test results
    """
    await connection_manager.connect(run_id, websocket)
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            
            # Handle ping/pong or other client messages if needed
            if data == "ping":
                await websocket.send_text("pong")
    
    except WebSocketDisconnect:
        await connection_manager.disconnect(run_id, websocket)
        logger.info(f"Client disconnected from run {run_id}")
    
    except Exception as e:
        logger.error(f"WebSocket error for run {run_id}: {e}")
        try:
            await connection_manager.disconnect(run_id, websocket)
        except:
            pass


