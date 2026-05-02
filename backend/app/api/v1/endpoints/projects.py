from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import httpx
import re
from pydantic import BaseModel

from app.db.session import get_db
from app.schemas.projects import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    BranchListResponse, TagListResponse
)
from app.services.project_service import ProjectService
from app.api.v1.endpoints.auth import get_current_user, require_lead_or_above

router = APIRouter()


@router.post("", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_lead_or_above),
):
    """Create a new project. Requires Automation Lead or Admin."""
    try:
        project = await ProjectService.create_project(db, project_data)
        return ProjectResponse.model_validate(project)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a project by ID."""
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return ProjectResponse.model_validate(project)


@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all projects with pagination."""
    projects = await ProjectService.list_projects(db, skip=skip, limit=limit)
    return [ProjectResponse.model_validate(p) for p in projects]


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a project."""
    project = await ProjectService.update_project(db, project_id, project_data)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a project."""
    success = await ProjectService.delete_project(db, project_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return None


@router.get("/{project_id}/branches", response_model=List[BranchListResponse])
async def get_project_branches(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get list of branches for a project's repository."""
    try:
        branches = await ProjectService.get_project_branches(project_id, db)
        return [BranchListResponse(**b) for b in branches]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch branches: {str(e)}"
        )


@router.get("/{project_id}/tags", response_model=List[TagListResponse])
async def get_project_tags(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get list of tags for a project's repository."""
    try:
        tags = await ProjectService.get_project_tags(project_id, db)
        return [TagListResponse(**t) for t in tags]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch tags: {str(e)}"
        )


# ── Per-project GitHub settings ───────────────────────────────────────────────

class ProjectGitHubConfig(BaseModel):
    github_token: Optional[str] = None
    github_repo_url: Optional[str] = None


class ProjectGitHubResponse(BaseModel):
    github_token_set: bool
    github_token_preview: str
    github_repo_url: str


class ProjectGitHubTestResponse(BaseModel):
    ok: bool
    login: Optional[str] = None
    name: Optional[str] = None
    error: Optional[str] = None


@router.delete("/{project_id}/github", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_project_github(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_lead_or_above),
):
    """Remove the GitHub token for this project."""
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    cfg = dict(project.config_json or {})
    cfg.pop("github_token", None)
    from app.schemas.projects import ProjectUpdate
    await ProjectService.update_project(db, project_id, ProjectUpdate(config_json=cfg))
    return None


@router.get("/{project_id}/github", response_model=ProjectGitHubResponse)
async def get_project_github(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_lead_or_above),
):
    """Get GitHub settings for a project (stored in config_json)."""
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    cfg = project.config_json or {}
    token = cfg.get("github_token", "")
    return ProjectGitHubResponse(
        github_token_set=bool(token),
        github_token_preview=("•••• " + token[-4:]) if len(token) >= 4 else ("set" if token else ""),
        github_repo_url=cfg.get("github_repo_url", project.git_repo_url or ""),
    )


@router.patch("/{project_id}/github", response_model=ProjectGitHubResponse)
async def update_project_github(
    project_id: str,
    payload: ProjectGitHubConfig,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_lead_or_above),
):
    """Save GitHub token/repo URL for this project (Automation Lead or Admin)."""
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    cfg = dict(project.config_json or {})
    if payload.github_token is not None:
        cfg["github_token"] = payload.github_token
    if payload.github_repo_url is not None:
        cfg["github_repo_url"] = payload.github_repo_url
    from app.schemas.projects import ProjectUpdate
    await ProjectService.update_project(db, project_id, ProjectUpdate(config_json=cfg))
    token = cfg.get("github_token", "")
    return ProjectGitHubResponse(
        github_token_set=bool(token),
        github_token_preview=("•••• " + token[-4:]) if len(token) >= 4 else ("set" if token else ""),
        github_repo_url=cfg.get("github_repo_url", project.git_repo_url or ""),
    )


@router.post("/{project_id}/github/test", response_model=ProjectGitHubTestResponse)
async def test_project_github(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_lead_or_above),
):
    """Test the project-level GitHub token."""
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    cfg = project.config_json or {}
    token = cfg.get("github_token", "")
    if not token:
        raise HTTPException(status_code=400, detail="No GitHub token configured for this project.")
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            )
        if resp.status_code == 200:
            data = resp.json()
            return ProjectGitHubTestResponse(ok=True, login=data.get("login"), name=data.get("name"))
        return ProjectGitHubTestResponse(ok=False, error=f"GitHub returned {resp.status_code}: {resp.text[:120]}")
    except Exception as exc:
        return ProjectGitHubTestResponse(ok=False, error=str(exc))


@router.get("/{project_id}/github/analyze")
async def analyze_project_repo(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_lead_or_above),
):
    """Analyze the repository to detect test frameworks and suites."""
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    cfg = project.config_json or {}
    token = cfg.get("github_token", "")
    if not token:
        raise HTTPException(status_code=400, detail="No GitHub token configured for this project.")
    repo_url = cfg.get("github_repo_url", project.git_repo_url or "")
    m = re.search(r"github\.com[:/]([^/]+)/([^/.]+)", repo_url)
    if not m:
        raise HTTPException(status_code=400, detail="Could not parse GitHub repo URL.")
    owner, repo = m.group(1), m.group(2).removesuffix(".git")
    branch = project.default_branch or "main"
    
    # Get the recursive tree
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}",
                params={"recursive": "1"},
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text[:200])
        
        tree_data = resp.json()
        files = [item["path"] for item in tree_data.get("tree", []) if item["type"] == "blob"]
        
        # Use framework detector to analyze
        from app.services.framework_detector import FrameworkDetector
        detector = FrameworkDetector()
        detected_frameworks = detector.detect_frameworks(files)
        detected_suites = detector.detect_suites(files)
        
        return {
            "frameworks": detected_frameworks,
            "suites": detected_suites,
            "files_count": len(files),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{project_id}/github/tree")
async def get_project_repo_tree(
    project_id: str,
    path: str = "",
    db: AsyncSession = Depends(get_db),
    _user=Depends(require_lead_or_above),
):
    """Fetch the GitHub repository tree at a given path."""
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    cfg = project.config_json or {}
    token = cfg.get("github_token", "")
    if not token:
        raise HTTPException(status_code=400, detail="No GitHub token configured for this project.")
    repo_url = cfg.get("github_repo_url", project.git_repo_url or "")
    # Extract owner/repo from URL (https://github.com/owner/repo)
    import re
    m = re.search(r"github\.com[:/]([^/]+)/([^/.]+)", repo_url)
    if not m:
        raise HTTPException(status_code=400, detail="Could not parse GitHub repo URL.")
    owner, repo = m.group(1), m.group(2).removesuffix(".git")
    branch = project.default_branch or "main"
    api_path = f"/repos/{owner}/{repo}/contents/{path}".rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"https://api.github.com{api_path}",
                params={"ref": branch},
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            )
        if resp.status_code == 200:
            return resp.json()
        raise HTTPException(status_code=resp.status_code, detail=resp.text[:200])
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
