import pytest
from app.services.github_service import GitHubService


class TestGitHubService:
    """Test suite for GitHub service."""
    
    def test_parse_github_url_https(self):
        """Test parsing HTTPS GitHub URL."""
        url = "https://github.com/microsoft/vscode.git"
        owner, repo = GitHubService.parse_github_url(url)
        assert owner == "microsoft"
        assert repo == "vscode"
    
    def test_parse_github_url_https_no_git_suffix(self):
        """Test parsing HTTPS GitHub URL without .git suffix."""
        url = "https://github.com/microsoft/vscode"
        owner, repo = GitHubService.parse_github_url(url)
        assert owner == "microsoft"
        assert repo == "vscode"
    
    def test_parse_github_url_ssh(self):
        """Test parsing SSH GitHub URL."""
        url = "git@github.com:microsoft/vscode.git"
        owner, repo = GitHubService.parse_github_url(url)
        assert owner == "microsoft"
        assert repo == "vscode"
    
    def test_parse_github_url_ssh_no_git_suffix(self):
        """Test parsing SSH GitHub URL without .git suffix."""
        url = "git@github.com:microsoft/vscode"
        owner, repo = GitHubService.parse_github_url(url)
        assert owner == "microsoft"
        assert repo == "vscode"
    
    def test_parse_invalid_github_url(self):
        """Test parsing invalid GitHub URL raises ValueError."""
        url = "https://not-github.com/owner/repo"
        try:
            GitHubService.parse_github_url(url)
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "Invalid GitHub URL" in str(e)
    
    def test_github_service_initialization(self):
        """Test GitHub service initialization."""
        service = GitHubService()
        assert service.base_url == "https://api.github.com"
        assert "Accept" in service.headers
        assert service.headers["Accept"] == "application/vnd.github.v3+json"
