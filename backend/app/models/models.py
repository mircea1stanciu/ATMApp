import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Text, DateTime, Enum, ForeignKey,
    Integer, Boolean, Float, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


def now_utc():
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    admin = "admin"
    automation_lead = "automation_lead"
    automation_user = "automation_user"
    developer = "developer"
    viewer = "viewer"


class RunStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    passed = "passed"
    failed = "failed"
    error = "error"
    cancelled = "cancelled"


class TestStatus(str, enum.Enum):
    passed = "passed"
    failed = "failed"
    skipped = "skipped"
    error = "error"


class GitProvider(str, enum.Enum):
    github = "github"
    gitlab = "gitlab"
    bitbucket = "bitbucket"


# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.viewer, nullable=False)
    assigned_lead_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    settings_json = Column(JSON, default=dict, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)


# ---------------------------------------------------------------------------
class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    git_repo_url = Column(String(512), nullable=False)
    git_provider = Column(Enum(GitProvider), default=GitProvider.github)
    default_branch = Column(String(255), default="main")
    framework = Column(String(100))          # pytest / playwright / cypress / robot / bruno
    config_json = Column(JSON, default=dict) # configurare specifică framework
    created_at = Column(DateTime(timezone=True), default=now_utc)

    suites = relationship("TestSuite", back_populates="project", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
class TestSuite(Base):
    __tablename__ = "test_suites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    name = Column(String(255), nullable=False)
    tags = Column(JSON, default=list)
    cron_expression = Column(String(100))    # null = fără scheduler
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    project = relationship("Project", back_populates="suites")
    runs = relationship("TestRun", back_populates="suite", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
class TestRun(Base):
    __tablename__ = "test_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    suite_id = Column(UUID(as_uuid=True), ForeignKey("test_suites.id"), nullable=False)
    status = Column(Enum(RunStatus), default=RunStatus.pending, nullable=False)
    branch = Column(String(255))
    commit_sha = Column(String(40))
    triggered_by = Column(String(255))       # user email / scheduler / webhook
    started_at = Column(DateTime(timezone=True))
    finished_at = Column(DateTime(timezone=True))
    total_tests = Column(Integer, default=0)
    passed_tests = Column(Integer, default=0)
    failed_tests = Column(Integer, default=0)
    skipped_tests = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    suite = relationship("TestSuite", back_populates="runs")
    results = relationship("TestResult", back_populates="run", cascade="all, delete-orphan")
    artifacts = relationship("Artifact", back_populates="run", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("test_runs.id"), nullable=False)
    test_name = Column(String(512), nullable=False)
    class_name = Column(String(512))
    status = Column(Enum(TestStatus), nullable=False)
    duration_ms = Column(Float)
    error_message = Column(Text)
    stack_trace = Column(Text)

    run = relationship("TestRun", back_populates="results")


# ---------------------------------------------------------------------------
class Artifact(Base):
    __tablename__ = "artifacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("test_runs.id"), nullable=False)
    file_path = Column(String(1024), nullable=False)
    file_type = Column(String(50))  # log / html / xml
    created_at = Column(DateTime(timezone=True), default=now_utc)

    run = relationship("TestRun", back_populates="artifacts")
