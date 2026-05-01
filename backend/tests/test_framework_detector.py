import pytest
from app.services.framework_detector import TestFramework, FrameworkDetector


class TestFrameworkDetector:
    """Test framework detection functionality."""
    
    def test_detect_pytest_from_files(self):
        """Test pytest detection from file paths."""
        files = [
            "tests/test_main.py",
            "tests/conftest.py",
            "setup.py",
        ]
        framework = FrameworkDetector.detect_from_files(files)
        assert framework == TestFramework.PYTEST
    
    def test_detect_pytest_from_config(self):
        """Test pytest detection from pytest.ini."""
        files = ["pytest.ini", "src/main.py"]
        framework = FrameworkDetector.detect_from_files(files)
        assert framework == TestFramework.PYTEST
    
    def test_detect_playwright_from_files(self):
        """Test Playwright detection."""
        files = [
            "playwright.config.ts",
            "tests/e2e.spec.ts",
        ]
        framework = FrameworkDetector.detect_from_files(files)
        assert framework == TestFramework.PLAYWRIGHT
    
    def test_detect_cypress_from_files(self):
        """Test Cypress detection."""
        files = [
            "cypress.config.js",
            "cypress/e2e/main.cy.js",
        ]
        framework = FrameworkDetector.detect_from_files(files)
        assert framework == TestFramework.CYPRESS
    
    def test_detect_robot_from_files(self):
        """Test Robot Framework detection."""
        files = [
            "tests/main.robot",
            "src/main.py",
        ]
        framework = FrameworkDetector.detect_from_files(files)
        assert framework == TestFramework.ROBOT
    
    def test_detect_unknown_framework(self):
        """Test unknown framework returns UNKNOWN."""
        files = ["src/main.py", "README.md"]
        framework = FrameworkDetector.detect_from_files(files)
        assert framework == TestFramework.UNKNOWN
    
    def test_get_pytest_run_command(self):
        """Test pytest run command generation."""
        cmd = FrameworkDetector.get_run_command(TestFramework.PYTEST, "tests/")
        assert "pytest" in cmd
        assert "tests/" in cmd
        assert "--junit-xml" in cmd
    
    def test_get_playwright_run_command(self):
        """Test Playwright run command generation."""
        cmd = FrameworkDetector.get_run_command(TestFramework.PLAYWRIGHT, "tests/")
        assert "playwright" in cmd
    
    def test_get_cypress_run_command(self):
        """Test Cypress run command generation."""
        cmd = FrameworkDetector.get_run_command(TestFramework.CYPRESS, "e2e/")
        assert "cypress" in cmd
    
    def test_detect_from_content_pytest(self):
        """Test pytest detection from file content."""
        content = {
            "test_main.py": """
import pytest

def test_something():
    assert True
"""
        }
        framework = FrameworkDetector.detect_from_content(content)
        assert framework == TestFramework.PYTEST
    
    def test_detect_from_content_playwright(self):
        """Test Playwright detection from content."""
        content = {
            "test.ts": """
import { test, expect } from '@playwright/test';

test('example', async ({ page }) => {
  await page.goto('https://example.com');
});
"""
        }
        framework = FrameworkDetector.detect_from_content(content)
        assert framework == TestFramework.PLAYWRIGHT
    
    def test_get_pytest_install_command(self):
        """Test pytest install command."""
        cmd = FrameworkDetector.get_install_command(TestFramework.PYTEST)
        assert cmd is not None
        assert "pytest" in cmd
    
    def test_get_playwright_install_command(self):
        """Test Playwright install command."""
        cmd = FrameworkDetector.get_install_command(TestFramework.PLAYWRIGHT)
        assert cmd is not None
        assert "playwright" in cmd
