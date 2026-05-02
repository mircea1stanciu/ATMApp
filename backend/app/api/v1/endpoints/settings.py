from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import httpx
import os
import re

from app.core.config import settings
from app.api.v1.endpoints.auth import require_admin, require_lead_or_above

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


class GitHubTestResponse(BaseModel):
    ok: bool
    login: Optional[str] = None
    name: Optional[str] = None
    plan: Optional[str] = None
    error: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=SettingsResponse)
async def get_settings(_user=Depends(require_lead_or_above)):
    """Return current MCP / integration settings (admin only)."""
    token = settings.GITHUB_TOKEN or ""
    return SettingsResponse(
        github_token_set=bool(token),
        github_token_preview=("•••• " + token[-4:]) if len(token) >= 4 else ("set" if token else ""),
        github_mcp_base_url=settings.GITHUB_MCP_BASE_URL,
    )


@router.patch("/github", response_model=SettingsResponse)
async def update_github_settings(
    payload: GitHubMCPConfig,
    _user=Depends(require_admin),
):
    """Save GitHub MCP token and/or base URL to .env (admin only)."""
    if payload.github_token is not None:
        _write_env_key("GITHUB_TOKEN", payload.github_token)
        settings.GITHUB_TOKEN = payload.github_token          # hot-patch in memory

    if payload.github_mcp_base_url is not None:
        _write_env_key("GITHUB_MCP_BASE_URL", payload.github_mcp_base_url)
        settings.GITHUB_MCP_BASE_URL = payload.github_mcp_base_url

    token = settings.GITHUB_TOKEN or ""
    return SettingsResponse(
        github_token_set=bool(token),
        github_token_preview=("•••• " + token[-4:]) if len(token) >= 4 else ("set" if token else ""),
        github_mcp_base_url=settings.GITHUB_MCP_BASE_URL,
    )


@router.post("/github/test", response_model=GitHubTestResponse)
async def test_github_connection(_user=Depends(require_lead_or_above)):
    """Verify the stored GitHub token by calling /user on the GitHub API."""
    token = settings.GITHUB_TOKEN
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No GitHub token configured.",
        )
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
            return GitHubTestResponse(
                ok=True,
                login=data.get("login"),
                name=data.get("name"),
                plan=data.get("plan", {}).get("name") if data.get("plan") else None,
            )
        return GitHubTestResponse(ok=False, error=f"GitHub returned {resp.status_code}: {resp.text[:120]}")
    except Exception as exc:
        return GitHubTestResponse(ok=False, error=str(exc))
