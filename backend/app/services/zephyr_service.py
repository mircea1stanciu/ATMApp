"""
Zephyr (Jira Test Management) integration service.
Supports Zephyr Squad (Server/DC) and Zephyr Scale (TM4J/Cloud).
"""
import httpx
from typing import Any, Optional


class ZephyrAuthError(Exception):
    """Raised when the Zephyr plugin rejects the auth token (e.g. PAT not supported by plugin)."""
    pass


class ZephyrPermissionError(Exception):
    """Raised when the user's token is valid but lacks Zephyr-specific permissions."""
    pass


class ZephyrService:
    """Service for interacting with Jira Zephyr API."""

    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }

    async def _get_project_id(self, project_key: str) -> Optional[str]:
        """
        Resolve a project key to its numeric Jira project ID.
        Needed for Zephyr Squad which uses IDs, not keys.
        """
        async with httpx.AsyncClient(timeout=10) as client:
            for api_version in ('rest/api/3', 'rest/api/2'):
                try:
                    resp = await client.get(
                        f'{self.base_url}/{api_version}/project/{project_key}',
                        headers=self.headers,
                    )
                    if resp.status_code == 200:
                        return str(resp.json().get('id', ''))
                except Exception:
                    continue
        return None

    def _is_login_redirect(self, resp: httpx.Response) -> bool:
        """Check if a response is a Jira login page redirect (auth/permission failure)."""
        if resp.status_code in (302, 301):
            location = resp.headers.get('location', '')
            return 'login.jsp' in location or 'permissionViolation' in location
        # Some setups follow redirects and return HTML with 200
        if resp.status_code == 200:
            ct = resp.headers.get('content-type', '')
            if 'text/html' in ct:
                return True
        return False

    async def _try_zephyr_squad(self, project_id: str) -> list[dict[str, Any]]:
        """
        Zephyr Squad (Server/DC/Cloud): GET /rest/zephyr/1.0/cycle
        Response is a dict where each key is a cycle ID (or 'recordsCount').
        versionId=-1 means "All Versions".

        Raises ZephyrAuthError if the plugin rejects the Bearer token (returns login redirect).
        """
        async with httpx.AsyncClient(timeout=15, follow_redirects=False) as client:
            try:
                resp = await client.get(
                    f'{self.base_url}/rest/zephyr/1.0/cycle',
                    params={'projectId': project_id, 'versionId': '-1'},
                    headers=self.headers,
                )
                if self._is_login_redirect(resp):
                    raise ZephyrAuthError(
                        "The Zephyr plugin on this Jira Server instance does not accept "
                        "Personal Access Token (Bearer) authentication. This typically occurs "
                        "when the Zephyr plugin version is older and only supports session-based "
                        "login, or when 2FA is enforced on the instance. "
                        "Contact your Jira administrator to: (1) upgrade Zephyr Squad to a "
                        "version that supports PAT auth, or (2) grant API access for the "
                        "service account without 2FA enforcement."
                    )
                if resp.status_code == 401:
                    raise ZephyrAuthError("Jira token is invalid or expired.")
                if resp.status_code == 403:
                    raise ZephyrPermissionError(
                        "The Jira token is valid but lacks Zephyr-specific permissions. "
                        "Ask your Jira admin to grant 'Zephyr View' permissions to your account."
                    )
                if resp.status_code != 200:
                    return []

                data = resp.json()
                cycles = []
                for key, value in data.items():
                    # Skip metadata fields
                    if not isinstance(value, dict):
                        continue
                    # Skip the built-in "Ad hoc" cycle (id=-1)
                    if str(key) == '-1':
                        continue
                    cycle = dict(value)
                    cycle['id'] = key
                    cycles.append(cycle)
                return cycles
            except (ZephyrAuthError, ZephyrPermissionError):
                raise
            except Exception:
                return []

    async def _try_zephyr_scale(self, project_key: str) -> list[dict[str, Any]]:
        """
        Zephyr Scale / TM4J: GET /rest/atm/1.0/testcycle?project={key}
        """
        async with httpx.AsyncClient(timeout=15) as client:
            try:
                resp = await client.get(
                    f'{self.base_url}/rest/atm/1.0/testcycle',
                    params={'project': project_key},
                    headers=self.headers,
                )
                if resp.status_code != 200:
                    return []
                data = resp.json()
                if isinstance(data, list):
                    return data
                if isinstance(data, dict):
                    return data.get('testcycles', data.get('values', []))
            except Exception:
                pass
        return []

    async def _try_zephyr_squad_cloud(self, project_key: str) -> list[dict[str, Any]]:
        """
        Zephyr Squad Cloud: GET /public/rest/api/1.0/cycles?projectKey={key}
        Used on Atlassian Cloud with Zephyr Squad app.
        """
        async with httpx.AsyncClient(timeout=15) as client:
            try:
                resp = await client.get(
                    f'{self.base_url}/public/rest/api/1.0/cycles',
                    params={'projectKey': project_key, 'maxRecords': '200'},
                    headers=self.headers,
                )
                if resp.status_code != 200:
                    return []
                data = resp.json()
                if isinstance(data, list):
                    return data
                if isinstance(data, dict):
                    return data.get('cycles', data.get('items', []))
            except Exception:
                pass
        return []

    async def get_cycles(self, project_key: str) -> list[dict[str, Any]]:
        """
        Get all test cycles for a project, trying multiple Zephyr API variants:
        1. Zephyr Squad (Server/DC) — uses numeric project ID
        2. Zephyr Scale / TM4J — uses project key
        3. Zephyr Squad Cloud — uses project key

        Raises ZephyrAuthError or ZephyrPermissionError if the API rejects the request
        with a recognizable auth/permission failure rather than just returning empty.
        """
        # Step 1: Resolve project key → numeric ID for Zephyr Squad
        project_id = await self._get_project_id(project_key)

        # Step 2: Try Zephyr Squad (Server/DC) first — most common on enterprise
        # This will raise ZephyrAuthError/ZephyrPermissionError if the plugin rejects auth.
        if project_id:
            cycles = await self._try_zephyr_squad(project_id)
            if cycles:
                return cycles

        # Step 3: Try Zephyr Scale / TM4J
        cycles = await self._try_zephyr_scale(project_key)
        if cycles:
            return cycles

        # Step 4: Try Zephyr Squad Cloud
        cycles = await self._try_zephyr_squad_cloud(project_key)
        return cycles
