from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    git_repo_url: str
    git_provider: str = "github"  # github, gitlab, bitbucket
    default_branch: str = "main"
    framework: Optional[str] = None  # pytest, playwright, cypress, robot
    config_json: Optional[Dict[str, Any]] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    default_branch: Optional[str] = None
    framework: Optional[str] = None
    config_json: Optional[Dict[str, Any]] = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    name: str
    description: Optional[str] = None
    git_repo_url: str
    git_provider: str
    default_branch: str
    framework: Optional[str] = None
    config_json: Optional[Dict[str, Any]] = None
    created_at: datetime


class BranchListResponse(BaseModel):
    name: str
    commit_sha: str
    is_default: bool


class TagListResponse(BaseModel):
    name: str
    commit_sha: str
