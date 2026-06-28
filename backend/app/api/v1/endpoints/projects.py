from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import httpx
from urllib.parse import urlparse
from pydantic import BaseModel

from app.db.session import get_db
from app.schemas.projects import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    BranchListResponse, TagListResponse
)
from app.services.project_service import ProjectService
from app.services.github_service import GitHubService
from app.api.v1.endpoints.auth import get_current_user, require_lead_or_above
from app.models.models import UserRole

router = APIRouter()


def _project_assigned_lead_id(project) -> Optional[str]:
    cfg = project.config_json or {}
    assigned_lead = cfg.get("assigned_lead_id")
    return str(assigned_lead) if assigned_lead else None


def _project_created_by_id(project) -> Optional[str]:
    cfg = project.config_json or {}
    created_by = cfg.get("created_by_id")
    return str(created_by) if created_by else None


def _can_view_project(project, user) -> bool:
    user_id = str(user.id)
    assigned_lead_id = _project_assigned_lead_id(project)
    created_by_id = _project_created_by_id(project)

    if user.role == UserRole.admin:
        # Admin sees only projects they created.
        # Legacy fallback: projects with no created_by_id AND no assigned_lead_id.
        if created_by_id:
            return created_by_id == user_id
        return not assigned_lead_id  # legacy unassigned project

    if user.role == UserRole.automation_lead:
        # Lead sees only projects assigned to them.
        return assigned_lead_id == user_id

    if user.role in {UserRole.automation_user, UserRole.viewer, UserRole.developer}:
        # User/Viewer sees only projects from their assigned lead.
        user_assigned_lead = str(user.assigned_lead_id) if user.assigned_lead_id else None
        return bool(user_assigned_lead and assigned_lead_id == user_assigned_lead)

    return False


def _enforce_view_project(project, user) -> None:
    if not _can_view_project(project, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this project")


def _enforce_manage_project(project, user) -> None:
    user_id = str(user.id)

    if user.role == UserRole.admin:
        # Admin can only manage projects they created.
        created_by_id = _project_created_by_id(project)
        assigned_lead_id = _project_assigned_lead_id(project)
        if created_by_id and created_by_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage your own projects")
        if not created_by_id and assigned_lead_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage your own projects")
        return

    if user.role != UserRole.automation_lead:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions for this action")

    assigned_lead_id = _project_assigned_lead_id(project)
    if assigned_lead_id and assigned_lead_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Automation Lead can manage only their assigned projects",
        )


def _user_settings(user) -> dict:
    return dict(getattr(user, "settings_json", {}) or {})


def _read_user_project_github_token(user, project_id: str) -> str:
    data = _user_settings(user)
    token_map = data.get("project_github_tokens")
    if not isinstance(token_map, dict):
        return ""
    return str(token_map.get(project_id) or "")


async def _set_user_project_github_token(db: AsyncSession, user, project_id: str, token: str) -> None:
    data = _user_settings(user)
    token_map = data.get("project_github_tokens")
    if not isinstance(token_map, dict):
        token_map = {}

    if token:
        token_map[project_id] = token
    else:
        token_map.pop(project_id, None)

    data["project_github_tokens"] = token_map
    user.settings_json = data
    await db.commit()
    await db.refresh(user)


def _build_github_user_endpoint(base_url: str) -> str:
    """Build /user endpoint for GitHub.com or GitHub Enterprise hosts."""
    if not base_url:
        return "https://api.github.com/user"

    parsed = urlparse(base_url)
    if not parsed.scheme or not parsed.netloc:
        return "https://api.github.com/user"

    host = parsed.netloc.lower()
    path = (parsed.path or "").strip("/")

    if host == "github.com" or host.endswith(".github.com"):
        return "https://api.github.com/user"

    if path.startswith("api/v3"):
        return f"{parsed.scheme}://{parsed.netloc}/{path}/user"
    return f"{parsed.scheme}://{parsed.netloc}/api/v3/user"


def _build_github_api_base(base_url: str) -> str:
    """Build API base URL for GitHub.com or GitHub Enterprise hosts."""
    if not base_url:
        return "https://api.github.com"

    parsed = urlparse(base_url)
    if not parsed.scheme or not parsed.netloc:
        return "https://api.github.com"

    host = parsed.netloc.lower()
    path = (parsed.path or "").strip("/")

    if host == "github.com" or host.endswith(".github.com"):
        return "https://api.github.com"

    if path.startswith("api/v3"):
        return f"{parsed.scheme}://{parsed.netloc}/{path}"
    return f"{parsed.scheme}://{parsed.netloc}/api/v3"


async def _diagnose_repo_404(api_base: str, owner: str, repo: str, token: str) -> str:
    """When /repos/{owner}/{repo} returns 404, probe search API to diagnose why."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"{api_base}/search/repositories",
                params={"q": f"{repo} org:{owner}"},
                headers={
                    "Authorization": f"token {token}",
                    "Accept": "application/vnd.github+json",
                },
            )
        if r.status_code == 200:
            items = r.json().get("items", [])
            match = next(
                (i for i in items if i.get("full_name", "").lower() == f"{owner}/{repo}".lower()),
                None,
            )
            if match:
                return (
                    f"The repository '{owner}/{repo}' exists and your account can find it via search, "
                    "but the token cannot access it through the REST API. "
                    "This is a known issue with fine-grained personal access tokens (github_pat_*) "
                    "on GitHub Enterprise Server. "
                    "Fix: regenerate the token as a Classic personal access token (ghp_*) with 'repo' scope, "
                    "or recreate the fine-grained PAT with the organization as resource owner "
                    "and grant 'Contents: Read' permission for this specific repository."
                )
        return (
            "Repository not found. Verify the repository URL, default branch, "
            "and that the project token has access to this repository."
        )
    except Exception:
        return (
            "Repository not found. Verify the repository URL, default branch, "
            "and that the project token has access to this repository."
        )


@router.post("", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_lead_or_above),
):
    """Create a new project. Requires Automation Lead or Admin."""
    try:
        cfg = dict(project_data.config_json or {})
        cfg["created_by_id"] = str(current_user.id)
        if current_user.role == UserRole.automation_lead:
            cfg["assigned_lead_id"] = str(current_user.id)
        project_data = project_data.model_copy(update={"config_json": cfg})
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
    _enforce_view_project(project, current_user)
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
    projects = [p for p in projects if _can_view_project(p, current_user)]
    return [ProjectResponse.model_validate(p) for p in projects]


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_lead_or_above),
):
    """Update a project."""
    existing = await ProjectService.get_project(db, project_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    _enforce_manage_project(existing, current_user)

    if current_user.role == UserRole.automation_lead:
        cfg = dict(existing.config_json or {})
        if "assigned_lead_id" not in cfg or not cfg.get("assigned_lead_id"):
            cfg["assigned_lead_id"] = str(current_user.id)
            incoming_cfg = dict(project_data.config_json or {})
            incoming_cfg.setdefault("assigned_lead_id", str(current_user.id))
            project_data = project_data.model_copy(update={"config_json": incoming_cfg if project_data.config_json is not None else cfg})

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
    current_user=Depends(require_lead_or_above),
):
    """Delete a project."""
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    _enforce_manage_project(project, current_user)

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
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _enforce_view_project(project, current_user)

    cfg = project.config_json or {}
    token = _read_user_project_github_token(current_user, project_id)
    if not token:
        raise HTTPException(status_code=400, detail="No GitHub token configured for your account on this project.")

    repo_url = cfg.get("github_repo_url", project.git_repo_url or "")
    try:
        owner, repo = GitHubService.parse_github_url(repo_url)
    except ValueError:
        raise HTTPException(status_code=400, detail="Could not parse GitHub repo URL.")

    api_base = _build_github_api_base(repo_url)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{api_base}/repos/{owner}/{repo}/branches",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            )
            if resp.status_code == 401:
                resp = await client.get(
                    f"{api_base}/repos/{owner}/{repo}/branches",
                    headers={
                        "Authorization": f"token {token}",
                        "Accept": "application/vnd.github+json",
                        "X-GitHub-Api-Version": "2022-11-28",
                    },
                )

        if resp.status_code == 200:
            default_branch = project.default_branch or "main"
            branches = [
                {
                    "name": b.get("name", ""),
                    "commit_sha": (b.get("commit") or {}).get("sha", ""),
                    "is_default": b.get("name") == default_branch,
                }
                for b in resp.json()
            ]
            return [BranchListResponse(**b) for b in branches]

        if resp.status_code == 401:
            raise HTTPException(
                status_code=400,
                detail="GitHub token invalid or expired for this project. Please reconnect your GitHub token.",
            )

        if resp.status_code == 404:
            detail = await _diagnose_repo_404(api_base, owner, repo, token)
            raise HTTPException(status_code=404, detail=detail)

        raise HTTPException(status_code=resp.status_code, detail=resp.text[:200])
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch branches: {str(exc)}"
        )


@router.get("/{project_id}/tags", response_model=List[TagListResponse])
async def get_project_tags(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get list of tags for a project's repository."""
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _enforce_view_project(project, current_user)

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
    current_user=Depends(get_current_user),
):
    """Remove current user's GitHub token for this project."""
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _enforce_view_project(project, current_user)
    await _set_user_project_github_token(db, current_user, project_id, "")
    return None


@router.get("/{project_id}/github", response_model=ProjectGitHubResponse)
async def get_project_github(
    project_id: str,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get project GitHub URL and current user's token state for the project."""
    response.headers["Cache-Control"] = "no-store, private"
    response.headers["Pragma"] = "no-cache"
    response.headers["Vary"] = "Authorization"

    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _enforce_view_project(project, current_user)
    cfg = project.config_json or {}
    token = _read_user_project_github_token(current_user, project_id)
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
    current_user=Depends(get_current_user),
):
    """Save current user's GitHub token; repo URL can be changed by lead/admin only."""
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _enforce_view_project(project, current_user)

    cfg = dict(project.config_json or {})

    if payload.github_repo_url is not None:
        _enforce_manage_project(project, current_user)
        if current_user.role == UserRole.automation_lead:
            cfg.setdefault("assigned_lead_id", str(current_user.id))
        cfg["github_repo_url"] = payload.github_repo_url
        from app.schemas.projects import ProjectUpdate
        project = await ProjectService.update_project(db, project_id, ProjectUpdate(config_json=cfg))
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

    if payload.github_token is not None:
        await _set_user_project_github_token(db, current_user, project_id, payload.github_token)

    token = _read_user_project_github_token(current_user, project_id)
    latest_cfg = project.config_json or {}
    return ProjectGitHubResponse(
        github_token_set=bool(token),
        github_token_preview=("•••• " + token[-4:]) if len(token) >= 4 else ("set" if token else ""),
        github_repo_url=latest_cfg.get("github_repo_url", project.git_repo_url or ""),
    )


@router.post("/{project_id}/github/test", response_model=ProjectGitHubTestResponse)
async def test_project_github(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Test current user's GitHub token for the selected project repository."""
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _enforce_view_project(project, current_user)
    cfg = project.config_json or {}
    token = _read_user_project_github_token(current_user, project_id)
    repo_url = cfg.get("github_repo_url", project.git_repo_url or "")
    if not token:
        raise HTTPException(status_code=400, detail="No GitHub token configured for your account on this project.")
    user_endpoint = _build_github_user_endpoint(repo_url)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                user_endpoint,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            )

        # Some enterprise setups expect `token` auth scheme.
        if resp.status_code == 401:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    user_endpoint,
                    headers={
                        "Authorization": f"token {token}",
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
    current_user=Depends(get_current_user),
):
    """Analyze the repository to detect test frameworks and suites."""
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _enforce_view_project(project, current_user)
    cfg = project.config_json or {}
    token = _read_user_project_github_token(current_user, project_id)
    if not token:
        raise HTTPException(status_code=400, detail="No GitHub token configured for your account on this project.")
    repo_url = cfg.get("github_repo_url", project.git_repo_url or "")
    try:
        owner, repo = GitHubService.parse_github_url(repo_url)
    except ValueError:
        raise HTTPException(status_code=400, detail="Could not parse GitHub repo URL.")

    api_base = _build_github_api_base(repo_url)
    branch = project.default_branch or "main"
    
    # Get the recursive tree
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{api_base}/repos/{owner}/{repo}/git/trees/{branch}",
                params={"recursive": "1"},
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            )

            if resp.status_code == 401:
                resp = await client.get(
                    f"{api_base}/repos/{owner}/{repo}/git/trees/{branch}",
                    params={"recursive": "1"},
                    headers={
                        "Authorization": f"token {token}",
                        "Accept": "application/vnd.github+json",
                        "X-GitHub-Api-Version": "2022-11-28",
                    },
                )
        if resp.status_code != 200:
            if resp.status_code == 401:
                raise HTTPException(
                    status_code=400,
                    detail="GitHub token invalid or expired for this project. Please reconnect your GitHub token.",
                )
            if resp.status_code == 404:
                detail = await _diagnose_repo_404(api_base, owner, repo, token)
                raise HTTPException(status_code=404, detail=detail)
            raise HTTPException(status_code=resp.status_code, detail=resp.text[:200])
        
        tree_data = resp.json()
        files = [item["path"] for item in tree_data.get("tree", []) if item["type"] == "blob"]
        
        # Use framework detector to analyze
        from app.services.framework_detector import FrameworkDetector
        detector = FrameworkDetector()
        detected_frameworks = detector.detect_frameworks(files)
        detected_projects = detector.detect_projects(files)
        
        return {
            "frameworks": detected_frameworks,
            "projects": detected_projects,
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
    current_user=Depends(get_current_user),
):
    """Fetch the GitHub repository tree at a given path."""
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _enforce_view_project(project, current_user)
    cfg = project.config_json or {}
    token = _read_user_project_github_token(current_user, project_id)
    if not token:
        raise HTTPException(status_code=400, detail="No GitHub token configured for your account on this project.")
    repo_url = cfg.get("github_repo_url", project.git_repo_url or "")
    try:
        owner, repo = GitHubService.parse_github_url(repo_url)
    except ValueError:
        raise HTTPException(status_code=400, detail="Could not parse GitHub repo URL.")

    api_base = _build_github_api_base(repo_url)
    branch = project.default_branch or "main"
    api_path = f"/repos/{owner}/{repo}/contents/{path}".rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{api_base}{api_path}",
                params={"ref": branch},
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            )
            if resp.status_code == 401:
                resp = await client.get(
                    f"{api_base}{api_path}",
                    params={"ref": branch},
                    headers={
                        "Authorization": f"token {token}",
                        "Accept": "application/vnd.github+json",
                        "X-GitHub-Api-Version": "2022-11-28",
                    },
                )
        if resp.status_code == 200:
            return resp.json()
        if resp.status_code == 401:
            raise HTTPException(
                status_code=400,
                detail="GitHub token invalid or expired for this project. Please reconnect your GitHub token.",
            )
        if resp.status_code == 404:
            detail = await _diagnose_repo_404(api_base, owner, repo, token)
            raise HTTPException(status_code=404, detail=detail)
        raise HTTPException(status_code=resp.status_code, detail=resp.text[:200])
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
