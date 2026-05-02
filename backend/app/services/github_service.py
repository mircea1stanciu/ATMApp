import httpx
from typing import Optional, List, Dict, Any
import re
from app.core.config import settings


class GitHubService:
    """Service for interacting with GitHub API."""
    
    def __init__(self):
        self.base_url = "https://api.github.com"
        self.token = settings.GITHUB_TOKEN
        self.headers = {
            "Authorization": f"token {self.token}" if self.token else "",
            "Accept": "application/vnd.github.v3+json",
        }
    
    @staticmethod
    def parse_github_url(git_repo_url: str) -> tuple[str, str]:
        """
        Parse GitHub URL to extract owner and repo name.
        Supports formats:
        - https://github.com/owner/repo.git
        - https://github.com/owner/repo
        - git@github.com:owner/repo.git
        - git@github.com:owner/repo
        """
        # Handle git@github.com format
        if git_repo_url.startswith("git@github.com:"):
            git_repo_url = git_repo_url.replace("git@github.com:", "https://github.com/")
        
        # Remove .git suffix if present
        if git_repo_url.endswith(".git"):
            git_repo_url = git_repo_url[:-4]
        
        # Must be a GitHub URL
        if not re.search(r"https?://(www\.)?github\.com", git_repo_url):
            raise ValueError(f"Invalid GitHub URL: {git_repo_url}")
        
        # Extract owner and repo from URL
        match = re.search(r"github\.com/([^/]+)/(.+)$", git_repo_url)
        if not match:
            raise ValueError(f"Invalid GitHub URL: {git_repo_url}")
        
        return match.group(1), match.group(2)
    
    async def get_branches(self, owner: str, repo: str) -> List[Dict[str, Any]]:
        """
        Get list of branches for a GitHub repository.
        
        Returns:
            List of branches with name, commit SHA, and whether it's default.
        """
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/repos/{owner}/{repo}/branches"
            try:
                response = await client.get(
                    url,
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                
                branches = response.json()
                
                # Get default branch info
                default_branch = await self._get_default_branch(owner, repo, client)
                
                return [
                    {
                        "name": branch["name"],
                        "commit_sha": branch["commit"]["sha"],
                        "is_default": branch["name"] == default_branch,
                    }
                    for branch in branches
                ]
            except httpx.HTTPError as e:
                raise ValueError(f"Failed to fetch branches: {str(e)}")
    
    async def get_tags(self, owner: str, repo: str) -> List[Dict[str, Any]]:
        """
        Get list of tags for a GitHub repository.
        
        Returns:
            List of tags with name and commit SHA.
        """
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/repos/{owner}/{repo}/tags"
            try:
                response = await client.get(
                    url,
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                
                tags = response.json()
                return [
                    {
                        "name": tag["name"],
                        "commit_sha": tag["commit"]["sha"],
                    }
                    for tag in tags
                ]
            except httpx.HTTPError as e:
                raise ValueError(f"Failed to fetch tags: {str(e)}")
    
    async def _get_default_branch(
        self, owner: str, repo: str, client: httpx.AsyncClient
    ) -> str:
        """Get the default branch name for a repository."""
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}"
            response = await client.get(
                url,
                headers=self.headers,
                timeout=10.0
            )
            response.raise_for_status()
            repo_data = response.json()
            return repo_data.get("default_branch", "main")
        except httpx.HTTPError:
            return "main"
    
    async def get_repository_info(self, owner: str, repo: str) -> Dict[str, Any]:
        """
        Get repository information from GitHub.
        
        Returns:
            Repository metadata including description, URL, stars, etc.
        """
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/repos/{owner}/{repo}"
            try:
                response = await client.get(
                    url,
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                
                repo_data = response.json()
                return {
                    "name": repo_data.get("name"),
                    "description": repo_data.get("description"),
                    "url": repo_data.get("html_url"),
                    "stars": repo_data.get("stargazers_count"),
                    "default_branch": repo_data.get("default_branch"),
                    "language": repo_data.get("language"),
                    "is_private": repo_data.get("private"),
                }
            except httpx.HTTPError as e:
                raise ValueError(f"Failed to fetch repository info: {str(e)}")
    
    async def check_repository_exists(self, git_repo_url: str) -> bool:
        """Check if a GitHub repository exists and is accessible."""
        try:
            owner, repo = self.parse_github_url(git_repo_url)
            await self.get_repository_info(owner, repo)
            return True
        except (ValueError, Exception):
            return False
