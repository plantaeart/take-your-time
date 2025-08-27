"""
Application version management.
Centralizes version information from pyproject.toml.

Usage:
    To update the application version, modify the version field in pyproject.toml:
    
    [project]
    name = "backend"
    version = "1.1.0"  # <- Update this line
    
    All parts of the application will automatically use the new version:
    - FastAPI app metadata
    - Health endpoint response
    - CLI version command
    - API documentation

Example:
    from app.version import __version__, get_version_info
    
    print(f"Current version: {__version__}")
    version_info = get_version_info()
    print(f"Major: {version_info['major']}")
    print(f"Minor: {version_info['minor']}")
    print(f"Patch: {version_info['patch']}")
"""
import toml
from pathlib import Path
from typing import Optional

# Path to the project root (where pyproject.toml is located)
PROJECT_ROOT = Path(__file__).parent.parent
PYPROJECT_PATH = PROJECT_ROOT / "pyproject.toml"


def get_version() -> str:
    """
    Get the application version from pyproject.toml.
    
    Returns:
        str: The version string (e.g., "0.1.0")
    """
    try:
        with open(PYPROJECT_PATH, "r", encoding="utf-8") as f:
            pyproject_data = toml.load(f)
            return pyproject_data["project"]["version"]
    except (FileNotFoundError, KeyError, toml.TomlDecodeError) as e:
        # Fallback version if pyproject.toml cannot be read
        return "0.1.0"


def get_version_info() -> dict:
    """
    Get detailed version information.
    
    Returns:
        dict: Version information including version string and metadata
    """
    version = get_version()
    
    # Parse semantic version components
    version_parts = version.split(".")
    major = int(version_parts[0]) if len(version_parts) > 0 else 0
    minor = int(version_parts[1]) if len(version_parts) > 1 else 0
    patch = int(version_parts[2]) if len(version_parts) > 2 else 0
    
    return {
        "version": version,
        "major": major,
        "minor": minor, 
        "patch": patch,
        "version_tuple": (major, minor, patch)
    }


# Export the version for easy import
__version__ = get_version()
