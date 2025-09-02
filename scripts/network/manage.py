"""
Network management for Take Your Time Docker containers.

This module provides commands to manage Docker networking for the application.
All containers use the same network for inter-container communication.
"""

import typer
import subprocess
import sys
from typing import Optional

# Network configuration
NETWORK_NAME = "take-your-time-network"

app = typer.Typer(
    name="network",
    help="Docker network management for Take Your Time containers",
    no_args_is_help=True
)

def run_command(command: list[str], check: bool = True) -> subprocess.CompletedProcess:
    """Run a shell command and return the result."""
    try:
        print(f"🔧 Running: {' '.join(command)}")
        result = subprocess.run(command, check=check, capture_output=True, text=True)
        if result.stdout.strip():
            print(f"✅ {result.stdout.strip()}")
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed: {e}")
        if e.stderr:
            print(f"Error: {e.stderr}")
        if check:
            sys.exit(1)
        return e

def network_exists() -> bool:
    """Check if the Docker network exists."""
    try:
        result = subprocess.run(
            ["docker", "network", "inspect", NETWORK_NAME],
            check=False,
            capture_output=True,
            text=True
        )
        return result.returncode == 0
    except Exception:
        return False

@app.command()
def create():
    """Create the Docker network for container communication."""
    print(f"🌐 Creating Docker network: {NETWORK_NAME}")
    
    if network_exists():
        print(f"✅ Network '{NETWORK_NAME}' already exists")
        return
    
    run_command([
        "docker", "network", "create",
        "--driver", "bridge",
        NETWORK_NAME
    ])
    print(f"✅ Network '{NETWORK_NAME}' created successfully")

@app.command()
def remove():
    """Remove the Docker network."""
    print(f"🗑️ Removing Docker network: {NETWORK_NAME}")
    
    if not network_exists():
        print(f"ℹ️ Network '{NETWORK_NAME}' does not exist")
        return
    
    # Stop containers using the network first
    print("🛑 Stopping containers on the network...")
    containers = ["fastapi-backend", "angular-frontend"]
    
    for container in containers:
        try:
            subprocess.run(
                ["docker", "stop", container],
                check=False,
                capture_output=True
            )
            subprocess.run(
                ["docker", "rm", container],
                check=False,
                capture_output=True
            )
        except Exception:
            pass
    
    run_command(["docker", "network", "rm", NETWORK_NAME])
    print(f"✅ Network '{NETWORK_NAME}' removed successfully")

@app.command()
def status():
    """Show network status and connected containers."""
    print(f"🔍 Checking network status: {NETWORK_NAME}")
    
    if not network_exists():
        print(f"❌ Network '{NETWORK_NAME}' does not exist")
        print("💡 Run 'uv run python main.py network create' to create it")
        return
    
    print(f"✅ Network '{NETWORK_NAME}' exists")
    
    # Show network details
    run_command(["docker", "network", "inspect", NETWORK_NAME])

@app.command()
def list_containers():
    """List containers connected to the network."""
    print(f"📋 Containers on network: {NETWORK_NAME}")
    
    if not network_exists():
        print(f"❌ Network '{NETWORK_NAME}' does not exist")
        return
    
    try:
        result = subprocess.run(
            ["docker", "network", "inspect", NETWORK_NAME, "--format", "{{range .Containers}}{{.Name}} {{end}}"],
            check=True,
            capture_output=True,
            text=True
        )
        
        containers = result.stdout.strip().split()
        if containers:
            print("Connected containers:")
            for container in containers:
                print(f"  • {container}")
        else:
            print("No containers connected to the network")
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to list containers: {e}")

@app.command()
def setup():
    """Setup the complete network infrastructure."""
    print("🚀 Setting up Take Your Time network infrastructure")
    
    # Create network
    create()
    
    # Show status
    status()
    
    print("\n✅ Network setup complete!")
    print("\n💡 Next steps:")
    print("1. Build your Docker images with tags")
    print("2. Run containers with: uv run python main.py fastapi run --tag <version>")
    print("3. Run containers with: uv run python main.py angular run --tag <version>")

if __name__ == "__main__":
    app()
