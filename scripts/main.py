#!/usr/bin/env python3
"""
Take Your Time - Docker Management CLI
Main entry point for MongoDB and FastAPI container management.
"""
import typer
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
import sys
import toml

# Function to get version from backend pyproject.toml
def get_backend_version():
    """Get version from backend pyproject.toml"""
    try:
        backend_pyproject = Path(__file__).parent.parent / "backend" / "pyproject.toml"
        with open(backend_pyproject, "r", encoding="utf-8") as f:
            data = toml.load(f)
            return data["project"]["version"]
    except Exception:
        return "unknown"

# Get version information
__version__ = get_backend_version()

def get_version_info():
    """Get version info similar to the backend version module"""
    version = __version__
    if version == "unknown":
        return {"version": "unknown"}
    
    try:
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
    except Exception:
        return {"version": version}

# Import sub-applications
from mongodb.manage import app as mongodb_app
from fastapi.manage import app as fastapi_app
from angular.manage import app as angular_app

# Main application
app = typer.Typer(
    name="take-your-time",
    help="🎯 Take Your Time - Docker Management CLI",
    add_completion=False
)
console = Console()

# Add sub-applications
app.add_typer(mongodb_app, name="mongodb", help="🍃 MongoDB container management")
app.add_typer(fastapi_app, name="fastapi", help="🚀 FastAPI container management")
app.add_typer(angular_app, name="angular", help="🅰️ Angular frontend container management")


@app.callback()
def main():
    """🎯 Take Your Time - Docker Management CLI for MongoDB, FastAPI, and Angular."""
    pass


@app.command("version")
def show_version():
    """📋 Show application version information."""
    version_info = get_version_info()
    
    console.print(Panel.fit(
        f"🎯 Take Your Time - Docker Management CLI\n"
        f"Version: {version_info['version']}\n"
        f"Backend API Version: {__version__}",
        style="blue"
    ))


@app.command("info")
def show_info():
    """ℹ️ Show information about available commands."""
    console.print(Panel.fit("🎯 Take Your Time - Docker Management CLI", style="bold blue"))
    
    console.print("\n[bold]Available Commands:[/bold]")
    console.print("📁 [cyan]mongodb[/cyan] - MongoDB container management")
    console.print("   • [green]start[/green] - Start MongoDB container")
    console.print("   • [red]stop[/red] - Stop MongoDB container")
    console.print("   • [blue]status[/blue] - Check container status")
    console.print("   • [yellow]logs[/yellow] - View container logs")
    console.print("   • [red]remove[/red] - Remove container")
    
    console.print("\n📁 [cyan]fastapi[/cyan] - FastAPI container management")
    console.print("   • [green]build[/green] - Build Docker image")
    console.print("   • [green]run[/green] - Run container")
    console.print("   • [blue]list[/blue] - List images and containers")
    console.print("   • [yellow]logs[/yellow] - View container logs")
    console.print("   • [red]remove-containers[/red] - Remove containers")
    console.print("   • [red]remove-images[/red] - Remove images")
    
    console.print("\n📁 [cyan]angular[/cyan] - Angular frontend container management")
    console.print("   • [green]build[/green] - Build Docker image")
    console.print("   • [green]run[/green] - Run container")
    console.print("   • [blue]list[/blue] - List images and containers")
    console.print("   • [yellow]logs[/yellow] - View container logs")
    console.print("   • [red]remove-containers[/red] - Remove containers")
    console.print("   • [red]remove-images[/red] - Remove images")
    console.print("   • [red]clean[/red] - Remove all containers and images")
    
    console.print("\n[bold]Examples:[/bold]")
    console.print("🍃 [dim]uv run python main.py mongodb start[/dim]")
    console.print("🚀 [dim]uv run python main.py fastapi build --tag v1.0[/dim]")
    console.print("🚀 [dim]uv run python main.py fastapi run --tag v1.0 --port 8080[/dim]")
    console.print("🅰️ [dim]uv run python main.py angular build[/dim]")
    console.print("🅰️ [dim]uv run python main.py angular run --port 4200[/dim]")
    console.print("📋 [dim]uv run python main.py fastapi list[/dim]")
    
    console.print("\n[bold]Quick Setup:[/bold]")
    console.print("1. 🍃 Start MongoDB: [green]uv run python main.py mongodb start[/green]")
    console.print("2. 🚀 Build FastAPI: [green]uv run python main.py fastapi build[/green]")
    console.print("3. 🚀 Run FastAPI: [green]uv run python main.py fastapi run[/green]")
    console.print("4. 🅰️ Build Angular: [green]uv run python main.py angular build[/green]")
    console.print("5. 🅰️ Run Angular: [green]uv run python main.py angular run[/green]")


if __name__ == "__main__":
    app()
