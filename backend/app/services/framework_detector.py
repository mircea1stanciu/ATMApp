import re
from enum import Enum
from typing import Dict, List, Tuple, Optional


class TestFramework(str, Enum):
    PYTEST = "pytest"
    PLAYWRIGHT = "playwright"
    CYPRESS = "cypress"
    ROBOT = "robot"
    JUNIT = "junit"
    UNKNOWN = "unknown"


class FrameworkDetector:
    """Detect test framework from repository content."""
    
    # Framework markers - files/patterns that indicate framework usage
    FRAMEWORK_MARKERS = {
        TestFramework.PYTEST: [
            "pytest.ini",
            "setup.cfg",  # with pytest config
            "pyproject.toml",  # with pytest config
            "conftest.py",
            "test_*.py",
            "*_test.py",
        ],
        TestFramework.PLAYWRIGHT: [
            "playwright.config.ts",
            "playwright.config.js",
            "@playwright/test",
        ],
        TestFramework.CYPRESS: [
            "cypress.config.js",
            "cypress.config.ts",
            "cypress/e2e",
            "cypress/integration",
        ],
        TestFramework.ROBOT: [
            "robot.yaml",
            "robot.config",
            ".robot",  # Changed from "*.robot" for better matching
        ],
        TestFramework.JUNIT: [
            "pom.xml",
            "build.gradle",
            "*.jar",
        ],
    }
    
    @staticmethod
    def detect_from_files(file_paths: List[str]) -> TestFramework:
        """
        Detect test framework from list of file paths.
        
        Args:
            file_paths: List of file paths from repository
            
        Returns:
            Detected TestFramework or UNKNOWN
        """
        file_paths_lower = [p.lower() for p in file_paths]
        
        # Check each framework in order of specificity (most specific first)
        # Robot framework should be checked early to avoid confusing with Python
        for framework in [TestFramework.ROBOT, TestFramework.PLAYWRIGHT, TestFramework.CYPRESS, TestFramework.JUNIT, TestFramework.PYTEST]:
            markers = FrameworkDetector.FRAMEWORK_MARKERS.get(framework, [])
            for marker in markers:
                if any(marker.lower() in path for path in file_paths_lower):
                    return framework
        
        return TestFramework.UNKNOWN
    
    @staticmethod
    def detect_from_content(content_dict: Dict[str, str]) -> TestFramework:
        """
        Detect framework by analyzing file contents.
        
        Args:
            content_dict: Dict of {filename: content}
            
        Returns:
            Detected TestFramework or UNKNOWN
        """
        for filename, content in content_dict.items():
            # Playwright detection
            if "playwright" in content.lower() and ("@playwright/test" in content or "import.*playwright" in content.lower()):
                return TestFramework.PLAYWRIGHT
            
            # Cypress detection
            if "cypress" in content.lower() and ("describe" in content or "it(" in content):
                if "cy." in content:
                    return TestFramework.CYPRESS
            
            # Pytest detection
            if filename.endswith((".py",)):
                if re.search(r"^import pytest", content, re.MULTILINE) or re.search(r"^from pytest", content, re.MULTILINE):
                    return TestFramework.PYTEST
                if re.search(r"def test_.*\(", content):
                    return TestFramework.PYTEST
            
            # Robot detection
            if filename.endswith(".robot"):
                return TestFramework.ROBOT
            
            # Java/JUnit detection
            if filename.endswith((".java", ".xml")):
                if "junit" in content.lower() or "testcase" in content.lower():
                    return TestFramework.JUNIT
        
        return TestFramework.UNKNOWN
    
    @staticmethod
    def get_run_command(framework: TestFramework, test_path: str = ".") -> str:
        """
        Get the command to run tests for a given framework.
        
        Args:
            framework: The test framework
            test_path: Path to tests directory
            
        Returns:
            Command to run tests
        """
        commands = {
            TestFramework.PYTEST: f"pytest {test_path} --junit-xml=results.xml -v",
            TestFramework.PLAYWRIGHT: f"npx playwright test {test_path}",
            TestFramework.CYPRESS: f"npx cypress run --spec '{test_path}/**/*.cy.js'",
            TestFramework.ROBOT: f"robot {test_path}",
            TestFramework.JUNIT: f"mvn test",
        }
        return commands.get(framework, f"echo 'Unknown framework: {framework}'")
    
    @staticmethod
    def get_install_command(framework: TestFramework) -> Optional[str]:
        """
        Get the command to install test framework dependencies.
        
        Args:
            framework: The test framework
            
        Returns:
            Install command or None
        """
        commands = {
            TestFramework.PYTEST: "pip install pytest pytest-cov pytest-xdist",
            TestFramework.PLAYWRIGHT: "npm install && npx playwright install",
            TestFramework.CYPRESS: "npm install",
            TestFramework.ROBOT: "pip install robotframework",
        }
        return commands.get(framework)
