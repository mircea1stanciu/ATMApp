from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import os
from typing import Optional, List
from datetime import datetime, timezone

from app.models.models import TestRun, TestResult, RunStatus, TestStatus, Project, TestSuite
from app.schemas.test_runs import TestRunCreate
from app.services.framework_detector import TestFramework, FrameworkDetector
from app.services.docker_runner import DockerTestRunner, TestRunEnvironment
from app.services.junit_parser import TestResultBuilder
from app.services.notification_service import NotificationService
from app.core.config import settings


class TestRunService:
    @staticmethod
    async def create_run(db: AsyncSession, run_data: TestRunCreate) -> TestRun:
        """Create a new test run."""
        run = TestRun(
            id=uuid.uuid4(),
            suite_id=run_data.suite_id,
            status=RunStatus.pending,
            branch=run_data.branch,
            commit_sha=run_data.commit_sha,
            triggered_by=run_data.triggered_by,
        )
        db.add(run)
        await db.commit()
        await db.refresh(run)
        return run

    @staticmethod
    async def get_run(db: AsyncSession, run_id: str) -> Optional[TestRun]:
        """Get test run by ID."""
        stmt = select(TestRun).where(TestRun.id == run_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def list_runs_by_suite(db: AsyncSession, suite_id: str, skip: int = 0, limit: int = 100) -> List[TestRun]:
        """List all test runs for a suite."""
        stmt = select(TestRun).where(TestRun.suite_id == suite_id).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def list_runs_by_project(db: AsyncSession, project_id: str, skip: int = 0, limit: int = 100) -> List[TestRun]:
        """List all test runs for a project."""
        from sqlalchemy import join
        stmt = select(TestRun).join(
            TestRun.suite
        ).filter_by(project_id=project_id).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def cancel_run(db: AsyncSession, run_id: str) -> Optional[TestRun]:
        """Cancel a running or pending run."""
        run = await TestRunService.get_run(db, run_id)
        if not run:
            return None
        if run.status in (RunStatus.running, RunStatus.pending):
            run.status = RunStatus.cancelled
            run.finished_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(run)
        return run

    @staticmethod
    async def delete_run(db: AsyncSession, run_id: str) -> bool:
        """Delete a run and all its results/artifacts."""
        run = await TestRunService.get_run(db, run_id)
        if not run:
            return False
        await db.delete(run)
        await db.commit()
        return True

    @staticmethod
    async def execute_test_run(
        db: AsyncSession,
        run_id: uuid.UUID,
        suite_id: uuid.UUID,
        project_id: uuid.UUID,
        branch: str = "main",
    ) -> None:
        """
        Execute a test run end-to-end.
        
        Args:
            db: Database session
            run_id: ID of TestRun record
            suite_id: ID of TestSuite
            project_id: ID of Project
            branch: Git branch to test
        """
        test_run = None
        suite = None
        project = None
        try:
            # Fetch test run, suite, and project
            test_run = await db.get(TestRun, run_id)
            if not test_run:
                raise ValueError(f"Test run {run_id} not found")
            
            suite = await db.get(TestSuite, suite_id)
            if not suite:
                raise ValueError(f"Test suite {suite_id} not found")
            
            project = await db.get(Project, project_id)
            if not project:
                raise ValueError(f"Project {project_id} not found")
            
            # Update run status to running
            test_run.status = RunStatus.running
            test_run.started_at = datetime.now(timezone.utc)
            db.add(test_run)
            await db.flush()
            
            # Setup environment
            env = TestRunEnvironment(str(run_id))
            runner = DockerTestRunner()
            
            # Clone repository
            repo_path = await runner.clone_repository(project.git_repo_url, branch)
            
            try:
                # Detect test framework
                framework = await TestRunService._detect_framework(repo_path)
                
                # Run tests
                exit_code, stdout, stderr = await runner.run_tests(
                    framework,
                    repo_path,
                    test_path=((suite.config_json or {}).get("test_path") or "."),
                    timeout=int((suite.config_json or {}).get("timeout_seconds") or 600),
                )
                
                # Parse results
                test_results = await TestRunService._parse_results(
                    framework,
                    exit_code,
                    stdout,
                    stderr,
                    env,
                )
                
                # Store results in database
                await TestRunService._store_results(
                    db,
                    test_run,
                    suite,
                    test_results,
                )
                
                # Update run status
                if exit_code == 0:
                    test_run.status = RunStatus.passed
                else:
                    test_run.status = RunStatus.failed
                    
            finally:
                runner.cleanup(repo_path)
            
            # Update completion time
            finished = datetime.now(timezone.utc)
            test_run.finished_at = finished
            if test_run.started_at:
                duration_secs = (finished - test_run.started_at).total_seconds()
                test_run.total_tests = test_run.total_tests or 0  # ensure int
            

            if test_run.status in (RunStatus.failed, RunStatus.error):
                await NotificationService.send_failure_notifications(test_run, suite, project)
            db.add(test_run)
            await db.commit()
            
        except Exception as e:
            # Handle execution error
            if test_run:
                test_run.status = RunStatus.error
                test_run.error_message = str(e)
                test_run.finished_at = datetime.now(timezone.utc)
                if suite and project:
                    await NotificationService.send_failure_notifications(test_run, suite, project)
                db.add(test_run)
                await db.commit()
            raise

    @staticmethod
    async def _detect_framework(repo_path: str) -> TestFramework:
        """Detect test framework in repository."""
        # Get all files in repo
        file_paths = []
        for root, dirs, files in os.walk(repo_path):
            for file in files:
                rel_path = os.path.relpath(os.path.join(root, file), repo_path)
                file_paths.append(rel_path)
        
        # Try to detect framework
        framework = FrameworkDetector.detect_from_files(file_paths)
        
        if framework != TestFramework.UNKNOWN:
            return framework
        
        # Try content-based detection
        content_dict = {}
        for file_path in file_paths[:50]:  # Sample first 50 files
            full_path = os.path.join(repo_path, file_path)
            if os.path.isfile(full_path) and os.path.getsize(full_path) < 100000:  # < 100KB
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        content_dict[file_path] = f.read()
                except:
                    pass
        
        return FrameworkDetector.detect_from_content(content_dict)

    @staticmethod
    async def _parse_results(
        framework: TestFramework,
        exit_code: int,
        stdout: str,
        stderr: str,
        env: TestRunEnvironment,
    ) -> dict:
        """Parse test results from framework output."""
        # Try to find JUnit XML results
        junit_file = env.get_artifact_path("results.xml")
        
        try:
            if os.path.exists(junit_file):
                with open(junit_file, "r") as f:
                    junit_xml = f.read()
                results = TestResultBuilder.from_junit_output(junit_xml, stdout, stderr)
            else:
                # Fallback to raw output parsing
                results = TestResultBuilder.from_raw_output(stdout, stderr, framework.value)
        except Exception as e:
            # If parsing fails, return raw output
            results = {
                "test_results": [],
                "total_tests": 0,
                "passed_tests": 0 if exit_code == 0 else 0,
                "failed_tests": 1 if exit_code != 0 else 0,
                "skipped_tests": 0,
                "stdout": stdout,
                "stderr": stderr,
            }
        
        return results

    @staticmethod
    async def _store_results(
        db: AsyncSession,
        test_run: TestRun,
        suite: TestSuite,
        results: dict,
    ) -> None:
        """Store test results in database."""
        # Update run with aggregate metrics
        test_run.total_tests = results.get("total_tests", 0)
        test_run.passed_tests = results.get("passed_tests", 0)
        test_run.failed_tests = results.get("failed_tests", 0)
        test_run.skipped_tests = results.get("skipped_tests", 0)
        
        # Store individual test results
        for result_data in results.get("test_results", []):
            test_result = TestResult(
                id=uuid.uuid4(),
                run_id=test_run.id,
                test_name=result_data.get("test_name", "unknown"),
                class_name=result_data.get("class_name", ""),
                status=result_data.get("status", TestStatus.error.value),
                duration_ms=result_data.get("duration_ms", 0),
                error_message=result_data.get("error_message"),
                stack_trace=result_data.get("stack_trace"),
            )
            db.add(test_result)
        
        db.add(test_run)
        await db.flush()
