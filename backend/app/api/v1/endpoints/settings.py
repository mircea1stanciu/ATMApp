from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import httpx
import os
import re
from urllib.parse import urlparse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.api.v1.endpoints.auth import get_current_user, require_admin, require_lead_or_above
from app.db.session import get_db
from app.models.models import UserRole, User
from app.services.zephyr_service import ZephyrService, ZephyrAuthError, ZephyrPermissionError

router = APIRouter()

ENV_FILE = os.path.join(os.path.dirname(__file__), "../../../../.env")


def _read_env() -> dict:
    """Read .env file into a dict."""
    env: dict = {}
    try:
        with open(ENV_FILE, "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    k, _, v = line.partition("=")
                    env[k.strip()] = v.strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return env


def _write_env_key(key: str, value: str):
    """Upsert a single key in the .env file."""
    try:
        with open(ENV_FILE, "r") as f:
            lines = f.readlines()
    except FileNotFoundError:
        lines = []

    pattern = re.compile(rf"^{re.escape(key)}\s*=")
    found = False
    new_lines = []
    for line in lines:
        if pattern.match(line):
            new_lines.append(f'{key}="{value}"\n')
            found = True
        else:
            new_lines.append(line)

    if not found:
        new_lines.append(f'{key}="{value}"\n')

    with open(ENV_FILE, "w") as f:
        f.writelines(new_lines)


# ── Schemas ──────────────────────────────────────────────────────────────────

class GitHubMCPConfig(BaseModel):
    github_token: Optional[str] = None
    github_mcp_base_url: Optional[str] = None


class SettingsResponse(BaseModel):
    github_token_set: bool
    github_token_preview: str        # last 4 chars or ""
    github_mcp_base_url: str


class JiraMCPConfig(BaseModel):
    jira_token: Optional[str] = None
    jira_mcp_base_url: Optional[str] = None
    jira_project_key: Optional[str] = None
    jira_project_name: Optional[str] = None


class JiraSettingsResponse(BaseModel):
    jira_token_set: bool
    jira_token_preview: str
    jira_mcp_base_url: str
    jira_project_key: Optional[str] = None
    jira_project_name: Optional[str] = None


class JiraTestResponse(BaseModel):
    ok: bool
    user: Optional[str] = None
    error: Optional[str] = None


class JiraProjectItem(BaseModel):
    id: str
    key: str
    name: str
    project_type: Optional[str] = None


class JiraProjectsResponse(BaseModel):
    projects: list[JiraProjectItem]


class ZephyrCycle(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created: Optional[str] = None
    updated: Optional[str] = None
    folder: Optional[str] = None


class ZephyrCyclesResponse(BaseModel):
    project_key: str
    cycles: list[ZephyrCycle]
    total: int


class ZephyrSettingsResponse(BaseModel):
    zephyr_project_key: str
    zephyr_selected_folder_id: str


class GitHubTestResponse(BaseModel):
    ok: bool
    login: Optional[str] = None
    name: Optional[str] = None
    plan: Optional[str] = None
    error: Optional[str] = None


def _user_settings(user) -> dict:
    return dict(getattr(user, "settings_json", {}) or {})


def _set_user_settings(user, data: dict) -> None:
    if hasattr(user, 'settings_json'):
        user.settings_json = data


def _read_setting(user_data: dict, key: str, fallback: str = "") -> str:
    if key in user_data:
        return str(user_data.get(key) or "")
    return fallback


def _can_manage_jira_project_config(user) -> bool:
    if user.role in {UserRole.admin, UserRole.automation_lead}:
        return True

    return user.role in {UserRole.automation_user, UserRole.viewer} and bool(getattr(user, 'assigned_lead_id', None))


def _build_github_user_endpoint(base_url: str) -> str:
    """Build the /user API endpoint from configured GitHub/GHE base URL."""
    if not base_url:
        return "https://api.github.com/user"

    parsed = urlparse(base_url)
    if not parsed.scheme or not parsed.netloc:
        return "https://api.github.com/user"

    host = parsed.netloc.lower()
    path = (parsed.path or "").strip("/")

    # Public GitHub
    if host == "github.com" or host.endswith(".github.com"):
        return "https://api.github.com/user"

    # If URL already points to API area, keep it.
    if path.startswith("api/v3"):
        return f"{parsed.scheme}://{parsed.netloc}/{path}/user"

    # GitHub Enterprise default REST root.
    return f"{parsed.scheme}://{parsed.netloc}/api/v3/user"


def _build_jira_api_candidates(base_url: str) -> list[str]:
    """Build Jira REST base candidates for Cloud/DC compatibility."""
    normalized = (base_url or "").strip().rstrip("/")
    if not normalized:
        return []

    return [
        f"{normalized}/rest/api/3",
        f"{normalized}/rest/api/2",
    ]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=SettingsResponse)
async def get_settings(_user=Depends(get_current_user)):
    """Return current user's GitHub integration settings."""
    data = _user_settings(_user)
    token = _read_setting(data, "github_token", "")
    base_url = _read_setting(data, "github_mcp_base_url", "")
    return SettingsResponse(
        github_token_set=bool(token),
        github_token_preview=("•••• " + token[-4:]) if len(token) >= 4 else ("set" if token else ""),
        github_mcp_base_url=base_url,
    )


@router.patch("/github", response_model=SettingsResponse)
async def update_github_settings(
    payload: GitHubMCPConfig,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save current user's GitHub token and/or base URL."""
    data = _user_settings(current_user)

    if payload.github_token is not None:
        data["github_token"] = payload.github_token

    if payload.github_mcp_base_url is not None:
        data["github_mcp_base_url"] = payload.github_mcp_base_url

    _set_user_settings(current_user, data)
    await db.commit()
    await db.refresh(current_user)

    token = _read_setting(data, "github_token", "")
    base_url = _read_setting(data, "github_mcp_base_url", "")
    return SettingsResponse(
        github_token_set=bool(token),
        github_token_preview=("•••• " + token[-4:]) if len(token) >= 4 else ("set" if token else ""),
        github_mcp_base_url=base_url,
    )


@router.post("/github/test", response_model=GitHubTestResponse)
async def test_github_connection(_user=Depends(get_current_user)):
    """Verify current user's GitHub token by calling /user on the GitHub API."""
    data = _user_settings(_user)
    token = _read_setting(data, "github_token", "")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No GitHub token configured.",
        )
    base_url = _read_setting(data, "github_mcp_base_url", "")
    user_endpoint = _build_github_user_endpoint(base_url)
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

        # Some GitHub Enterprise setups expect `token` instead of `Bearer`.
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
            return GitHubTestResponse(
                ok=True,
                login=data.get("login"),
                name=data.get("name"),
                plan=data.get("plan", {}).get("name") if data.get("plan") else None,
            )
        return GitHubTestResponse(ok=False, error=f"GitHub returned {resp.status_code}: {resp.text[:120]}")
    except Exception as exc:
        return GitHubTestResponse(ok=False, error=str(exc))


@router.get("/jira", response_model=JiraSettingsResponse)
async def get_jira_settings(_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Return current user's Jira integration settings.
    
    For Automation User/Viewer: Returns project and base_url configured by their Lead, with their own token.
    For Lead/Admin: Returns their own configuration.
    """
    # Determine where to read project configuration from
    import logging
    _log = logging.getLogger("settings.jira")
    assigned_lead_id = getattr(_user, 'assigned_lead_id', None)
    _log.warning(f"GET /jira: user={_user.email}, role={_user.role}, assigned_lead_id={assigned_lead_id}")
    config_source_user = _user
    if _user.role in {UserRole.automation_user, UserRole.viewer} and assigned_lead_id:
        stmt = select(User).where(User.id == assigned_lead_id)
        result = await db.execute(stmt)
        lead = result.scalar_one_or_none()
        _log.warning(f"GET /jira: lead found={lead is not None}, lead_email={lead.email if lead else 'N/A'}")
        if lead:
            config_source_user = lead
            lead_settings = _user_settings(lead)
            _log.warning(f"GET /jira: lead settings_json keys={list(lead_settings.keys()) if lead_settings else 'NONE'}, jira_mcp_base_url={lead_settings.get('jira_mcp_base_url', 'NOT_SET')}")

    # Get all settings from config source (lead for User/Viewer, self for Lead/Admin)
    config_data = _user_settings(config_source_user)
    project_key = _read_setting(config_data, "jira_project_key", "")
    project_name = _read_setting(config_data, "jira_project_name", "")
    base_url = _read_setting(config_data, "jira_mcp_base_url", "")
    _log.warning(f"GET /jira: returning base_url={base_url!r}, project_key={project_key!r}")
    
    # Get token from current user only
    user_data = _user_settings(_user)
    token = _read_setting(user_data, "jira_token", "")
    
    return JiraSettingsResponse(
        jira_token_set=bool(token),
        jira_token_preview=("•••• " + token[-4:]) if len(token) >= 4 else ("set" if token else ""),
        jira_mcp_base_url=base_url,
        jira_project_key=(project_key or None),
        jira_project_name=(project_name or None),
    )


@router.patch("/jira", response_model=JiraSettingsResponse)
async def update_jira_settings(
    payload: JiraMCPConfig,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save current user's Jira token; base URL is lead/admin and project selection is scoped."""
    data = _user_settings(current_user)

    tries_to_change_base_url = payload.jira_mcp_base_url is not None
    if tries_to_change_base_url and current_user.role not in {UserRole.admin, UserRole.automation_lead}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin and Automation Lead can change Jira base URL",
        )

    tries_to_change_project = payload.jira_project_key is not None or payload.jira_project_name is not None
    if tries_to_change_project and not _can_manage_jira_project_config(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Automation Leads and assigned Automation Users/Visitors can change Jira project selection",
        )

    if payload.jira_token is not None:
        data["jira_token"] = payload.jira_token

    if payload.jira_mcp_base_url is not None:
        data["jira_mcp_base_url"] = payload.jira_mcp_base_url

    if payload.jira_project_key is not None:
        data["jira_project_key"] = payload.jira_project_key

    if payload.jira_project_name is not None:
        data["jira_project_name"] = payload.jira_project_name

    _set_user_settings(current_user, data)
    await db.commit()
    await db.refresh(current_user)

    # For the response, get base_url and project from lead if User/Viewer
    config_source_user = current_user
    assigned_lead_id = getattr(current_user, 'assigned_lead_id', None)
    if current_user.role in {UserRole.automation_user, UserRole.viewer} and assigned_lead_id:
        stmt = select(User).where(User.id == assigned_lead_id)
        result = await db.execute(stmt)
        lead = result.scalar_one_or_none()
        if lead:
            config_source_user = lead

    config_data = _user_settings(config_source_user)
    token = _read_setting(data, "jira_token", "")
    base_url = _read_setting(config_data, "jira_mcp_base_url", "")
    project_key = _read_setting(config_data, "jira_project_key", "")
    project_name = _read_setting(config_data, "jira_project_name", "")
    return JiraSettingsResponse(
        jira_token_set=bool(token),
        jira_token_preview=("•••• " + token[-4:]) if len(token) >= 4 else ("set" if token else ""),
        jira_mcp_base_url=base_url,
        jira_project_key=(project_key or None),
        jira_project_name=(project_name or None),
    )


@router.post("/jira/test", response_model=JiraTestResponse)
async def test_jira_connection(_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Verify Jira token by calling /myself.
    
    For Automation User/Viewer: Uses their own token and Lead's base_url.
    For Lead/Admin: Uses their own token and base_url.
    """
    # Determine where to read configuration from
    config_source_user = _user
    assigned_lead_id = getattr(_user, 'assigned_lead_id', None)
    if _user.role in {UserRole.automation_user, UserRole.viewer} and assigned_lead_id:
        stmt = select(User).where(User.id == assigned_lead_id)
        result = await db.execute(stmt)
        lead = result.scalar_one_or_none()
        if lead:
            config_source_user = lead

    # Get base_url from appropriate source (lead for User/Viewer, self for Lead/Admin)
    config_data = _user_settings(config_source_user)
    base_url = _read_setting(config_data, "jira_mcp_base_url", "")
    
    # Always use current user's own token
    user_data = _user_settings(_user)
    token = _read_setting(user_data, "jira_token", "")
    
    if not token or not base_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Jira token or Jira base URL is not configured.",
        )

    candidates = _build_jira_api_candidates(base_url)
    last_error = ""

    for api_base in candidates:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{api_base}/myself",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Accept": "application/json",
                    },
                )

            if resp.status_code == 200:
                data = resp.json()
                user = data.get("displayName") or data.get("name") or data.get("emailAddress")
                return JiraTestResponse(ok=True, user=user)
            last_error = f"{resp.status_code}: {resp.text[:120]}"
        except Exception as exc:
            last_error = str(exc)

    return JiraTestResponse(ok=False, error=last_error or "Unable to connect to Jira.")


@router.get("/jira/projects", response_model=JiraProjectsResponse)
async def list_jira_projects(_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """List Jira projects via configured Jira MCP/base URL and token.
    
    For Automation User/Viewer: Show projects configured by their assigned Lead, but use their own token.
    For Lead/Admin: Show all available projects with their own token.
    """
    if not _can_manage_jira_project_config(_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Jira project configuration is available only for Automation Leads and assigned Automation Users/Visitors",
        )

    # Determine where to read project configuration from
    config_source_user = _user
    assigned_lead_id = getattr(_user, 'assigned_lead_id', None)
    if _user.role in {UserRole.automation_user, UserRole.viewer} and assigned_lead_id:
        stmt = select(User).where(User.id == assigned_lead_id)
        result = await db.execute(stmt)
        lead = result.scalar_one_or_none()
        if lead:
            config_source_user = lead

    # Get project config from appropriate source
    config_data = _user_settings(config_source_user)
    config_project_key = _read_setting(config_data, "jira_project_key", "")
    config_project_name = _read_setting(config_data, "jira_project_name", "")
    
    # For User/Viewer: get base_url from Lead's config
    # For Lead/Admin: get base_url from their own config
    base_url = _read_setting(config_data, "jira_mcp_base_url", "")
    
    # Always use current user's own token for authentication
    user_data = _user_settings(_user)
    token = _read_setting(user_data, "jira_token", "")
    
    if not token or not base_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Jira token or Jira base URL is not configured.",
        )

    candidates = _build_jira_api_candidates(base_url)
    last_error = ""

    for api_base in candidates:
        for path in ("/project/search", "/project"):
            try:
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.get(
                        f"{api_base}{path}",
                        headers={
                            "Authorization": f"Bearer {token}",
                            "Accept": "application/json",
                        },
                    )

                if resp.status_code != 200:
                    last_error = f"{resp.status_code}: {resp.text[:120]}"
                    continue

                payload = resp.json()
                raw_items = payload.get("values", payload) if isinstance(payload, dict) else payload
                if not isinstance(raw_items, list):
                    raw_items = []

                projects = [
                    JiraProjectItem(
                        id=str(item.get("id", "")),
                        key=str(item.get("key", "")),
                        name=str(item.get("name", "")),
                        project_type=item.get("projectTypeKey"),
                    )
                    for item in raw_items
                    if item.get("id") and item.get("key") and item.get("name")
                ]
                projects.sort(key=lambda p: p.key)
                return JiraProjectsResponse(projects=projects)
            except Exception as exc:
                last_error = str(exc)

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"Failed to list Jira projects. {last_error}",
    )


# ── Zephyr (Test Manager) endpoints ──────────────────────────────────────────

@router.get("/zephyr", response_model=ZephyrSettingsResponse)
async def get_zephyr_settings(_user=Depends(get_current_user)):
    """Return current Zephyr project and folder selection."""
    return ZephyrSettingsResponse(
        zephyr_project_key=settings.ZEPHYR_PROJECT_KEY or "",
        zephyr_selected_folder_id=settings.ZEPHYR_SELECTED_FOLDER_ID or "",
    )


@router.patch("/zephyr", response_model=ZephyrSettingsResponse)
async def update_zephyr_settings(
    payload: dict,
    _user=Depends(require_admin),
):
    """Save Zephyr project and folder selection to .env (admin only)."""
    if "zephyr_project_key" in payload:
        project_key = payload["zephyr_project_key"]
        _write_env_key("ZEPHYR_PROJECT_KEY", project_key)
        settings.ZEPHYR_PROJECT_KEY = project_key

    if "zephyr_selected_folder_id" in payload:
        folder_id = payload["zephyr_selected_folder_id"]
        _write_env_key("ZEPHYR_SELECTED_FOLDER_ID", folder_id)
        settings.ZEPHYR_SELECTED_FOLDER_ID = folder_id

    return ZephyrSettingsResponse(
        zephyr_project_key=settings.ZEPHYR_PROJECT_KEY or "",
        zephyr_selected_folder_id=settings.ZEPHYR_SELECTED_FOLDER_ID or "",
    )


@router.get("/zephyr/cycles/{project_key}", response_model=ZephyrCyclesResponse)
async def get_zephyr_cycles(
    project_key: str,
    _user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List Zephyr test cycles (folders) for a project.
    
    For Automation User/Viewer: Uses their own token but Lead's base_url.
    For Lead/Admin: Uses their own token and base_url.
    """
    # Determine where to read configuration from
    config_source_user = _user
    assigned_lead_id = getattr(_user, 'assigned_lead_id', None)
    if _user.role in {UserRole.automation_user, UserRole.viewer} and assigned_lead_id:
        stmt = select(User).where(User.id == assigned_lead_id)
        result = await db.execute(stmt)
        lead = result.scalar_one_or_none()
        if lead:
            config_source_user = lead

    # Get base_url from appropriate source (lead for User/Viewer, self for Lead/Admin)
    config_data = _user_settings(config_source_user)
    base_url = _read_setting(config_data, "jira_mcp_base_url", "") or settings.JIRA_MCP_BASE_URL
    
    # Always use current user's own token
    user_data = _user_settings(_user)
    token = _read_setting(user_data, "jira_token", "") or settings.JIRA_TOKEN

    if not token or not base_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Jira token or base URL not configured.",
        )

    try:
        zephyr = ZephyrService(base_url, token)
        cycles_data = await zephyr.get_cycles(project_key)
        
        # Convert raw API response to ZephyrCycle objects.
        # Zephyr Squad uses string IDs; Zephyr Scale uses numeric IDs.
        # Field names also differ between versions.
        cycles = []
        for item in cycles_data:
            if not isinstance(item, dict):
                continue
            raw_id = item.get("id", "")
            if not raw_id and raw_id != 0:
                continue
            # Prefer Zephyr Squad field names, fall back to Zephyr Scale names
            name = item.get("name") or item.get("cycleName") or "Unnamed"
            description = item.get("description") or item.get("cycleDescription")
            created = (
                item.get("createdOn") or item.get("startDate")
                or item.get("created")
            )
            updated = (
                item.get("modifiedOn") or item.get("endDate")
                or item.get("updatedOn") or item.get("updated")
            )
            cycles.append(ZephyrCycle(
                id=str(raw_id),
                name=name,
                description=description,
                created=created,
                updated=updated,
                folder=item.get("folder"),
            ))

        return ZephyrCyclesResponse(
            project_key=project_key,
            cycles=cycles,
            total=len(cycles),
        )
    except ZephyrAuthError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"ZEPHYR_AUTH_ERROR: {str(e)}",
        )
    except ZephyrPermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"ZEPHYR_PERMISSION_ERROR: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch Zephyr cycles: {str(e)}",
        )


@router.get("/zephyr/diagnose/{project_key}")
async def diagnose_zephyr(
    project_key: str,
    _user=Depends(require_lead_or_above),
):
    """
    Diagnostic endpoint: probes all known Zephyr/Jira API variants
    and returns raw status codes + response snippets for debugging.
    """
    import base64

    token = settings.JIRA_TOKEN
    base_url = settings.JIRA_MCP_BASE_URL
    if not token or not base_url:
        raise HTTPException(status_code=400, detail="Jira token or base URL not configured.")

    normalized = base_url.rstrip("/")
    results: list[dict] = []

    # Both auth styles: Bearer and Basic (email:token base64)
    auth_headers_list = [
        {"Authorization": f"Bearer {token}", "Accept": "application/json"},
    ]
    # If token looks like email:token or contains ":", also try Basic
    if ":" in token:
        encoded = base64.b64encode(token.encode()).decode()
        auth_headers_list.append({"Authorization": f"Basic {encoded}", "Accept": "application/json"})

    endpoints_to_probe = [
        # Step 0: Resolve project ID
        ("project_lookup_v3", f"{normalized}/rest/api/3/project/{project_key}", {}),
        ("project_lookup_v2", f"{normalized}/rest/api/2/project/{project_key}", {}),
        # Zephyr Squad Server/DC (needs project ID, but try key too)
        ("zephyr_squad_by_key", f"{normalized}/rest/zephyr/1.0/cycle", {"projectKey": project_key, "versionId": "-1"}),
        # Zephyr Scale / TM4J
        ("zephyr_scale_testcycles", f"{normalized}/rest/atm/1.0/testcycle", {"project": project_key}),
        ("zephyr_scale_testcycles_maxResults", f"{normalized}/rest/atm/1.0/testcycle", {"project": project_key, "maxResults": "50"}),
        # Zephyr Squad Cloud
        ("zephyr_squad_cloud", f"{normalized}/public/rest/api/1.0/cycles", {"projectKey": project_key, "maxRecords": "50"}),
    ]

    async with httpx.AsyncClient(timeout=10) as client:
        for label, url, params in endpoints_to_probe:
            for auth_idx, auth_hdrs in enumerate(auth_headers_list):
                auth_label = "bearer" if auth_idx == 0 else "basic"
                try:
                    resp = await client.get(url, params=params, headers=auth_hdrs)
                    body = resp.text[:500]
                    results.append({
                        "probe": f"{label} [{auth_label}]",
                        "url": str(resp.url),
                        "status": resp.status_code,
                        "body_snippet": body,
                    })
                except Exception as exc:
                    results.append({
                        "probe": f"{label} [{auth_label}]",
                        "url": url,
                        "status": "error",
                        "body_snippet": str(exc),
                    })

    return {"project_key": project_key, "probes": results}
