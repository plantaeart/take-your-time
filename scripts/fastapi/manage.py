#!/usr/bin/env python3
"""
FastAPI Docker Container Management Script
Commands to build, run, and manage FastAPI containers with interactive selection.
"""
import typer
import subprocess
import sys
import json
from typing import List, Optional, Dict, Any
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.prompt import Prompt, Confirm
from rich.text import Text
from pathlib import Path

app = typer.Typer(
    name="fastapi",
    help="🚀 FastAPI Docker Container Management",
    add_completion=False
)
console = Console()

IMAGE_BASE_NAME = "take-your-time-fastapi"
CONTAINER_NAME = "fastapi-backend"
NETWORK_NAME = "take-your-time-network"
BACKEND_PATH = Path(__file__).parent.parent.parent / "backend"


def run_command(command: str, capture_output: bool = True, cwd: Optional[Path] = None) -> subprocess.CompletedProcess:
    """Run a shell command and return the result."""
    try:
        if capture_output:
            result = subprocess.run(
                command.split(),
                capture_output=True,
                text=True,
                check=False,
                cwd=cwd
            )
        else:
            result = subprocess.run(command.split(), check=False, cwd=cwd)
        return result
    except Exception as e:
        console.print(f"[red]❌ Error running command: {e}[/red]")
        return None


def get_fastapi_images() -> List[Dict[str, str]]:
    """Get list of FastAPI images."""
    result = run_command("docker images --format json")
    if not result or result.returncode != 0:
        return []
    
    images = []
    for line in result.stdout.strip().split('\n'):
        if line.strip():
            try:
                image = json.loads(line)
                if IMAGE_BASE_NAME in image.get('Repository', ''):
                    images.append({
                        'id': image.get('ID', ''),
                        'repository': image.get('Repository', ''),
                        'tag': image.get('Tag', ''),
                        'size': image.get('Size', ''),
                        'created': image.get('CreatedSince', '')
                    })
            except json.JSONDecodeError:
                continue
    
    return images


def get_fastapi_containers() -> List[Dict[str, str]]:
    """Get list of FastAPI containers."""
    result = run_command("docker ps -a --format json")
    if not result or result.returncode != 0:
        return []
    
    containers = []
    for line in result.stdout.strip().split('\n'):
        if line.strip():
            try:
                container = json.loads(line)
                image = container.get('Image', '')
                if IMAGE_BASE_NAME in image:
                    containers.append({
                        'id': container.get('ID', ''),
                        'names': container.get('Names', ''),
                        'image': image,
                        'status': container.get('Status', ''),
                        'ports': container.get('Ports', ''),
                        'created': container.get('CreatedAt', '')
                    })
            except json.JSONDecodeError:
                continue
    
    return containers


def display_images_table(images: List[Dict[str, str]]) -> None:
    """Display images in a formatted table."""
    if not images:
        console.print("[yellow]No FastAPI images found[/yellow]")
        return
    
    table = Table(title="FastAPI Images")
    table.add_column("№", style="cyan", no_wrap=True)
    table.add_column("Repository", style="magenta")
    table.add_column("Tag", style="green")
    table.add_column("Image ID", style="blue")
    table.add_column("Size", style="yellow")
    table.add_column("Created", style="white")
    
    for i, image in enumerate(images, 1):
        table.add_row(
            str(i),
            image['repository'],
            image['tag'],
            image['id'][:12],
            image['size'],
            image['created']
        )
    
    console.print(table)


def display_containers_table(containers: List[Dict[str, str]]) -> None:
    """Display containers in a formatted table."""
    if not containers:
        console.print("[yellow]No FastAPI containers found[/yellow]")
        return
    
    table = Table(title="FastAPI Containers")
    table.add_column("№", style="cyan", no_wrap=True)
    table.add_column("Name", style="magenta")
    table.add_column("Image", style="green")
    table.add_column("Status", style="blue")
    table.add_column("Ports", style="yellow")
    table.add_column("Container ID", style="white")
    
    for i, container in enumerate(containers, 1):
        status_style = "green" if "Up" in container['status'] else "red"
        table.add_row(
            str(i),
            container['names'],
            container['image'],
            f"[{status_style}]{container['status']}[/{status_style}]",
            container['ports'],
            container['id'][:12]
        )
    
    console.print(table)


@app.command("build")
def build_image(
    tag: str = typer.Option("latest", "--tag", "-t", help="Image tag")
):
    """🏗️ Build FastAPI Docker image."""
    console.print(Panel.fit(f"🏗️ Building FastAPI Image: {IMAGE_BASE_NAME}:{tag}", style="blue"))
    
    if not BACKEND_PATH.exists():
        console.print(f"[red]❌ Backend path not found: {BACKEND_PATH}[/red]")
        return
    
    if not (BACKEND_PATH / "Dockerfile").exists():
        console.print(f"[red]❌ Dockerfile not found in: {BACKEND_PATH}[/red]")
        return
    
    image_name = f"{IMAGE_BASE_NAME}:{tag}"
    console.print(f"[blue]🔨 Building image {image_name}...[/blue]")
    console.print(f"[dim]Building from: {BACKEND_PATH}[/dim]")
    console.print(f"[yellow]📝 Using --no-cache to ensure latest changes are included[/yellow]")
    
    result = run_command(f"docker build -t {image_name} --no-cache .", capture_output=False, cwd=BACKEND_PATH)
    
    if result and result.returncode == 0:
        console.print(f"[green]✅ Successfully built image: {image_name}[/green]")
        console.print(f"[blue]💡 Run with: fastapi run --tag {tag}[/blue]")
        
        # Ask if user wants to run a container with the newly built image
        if Confirm.ask("\nDo you want to run a container with this image now?", default=False):
            port = 8000
            
            # Check if container name already exists
            result_check = run_command(f"docker ps -a -q -f name={CONTAINER_NAME}")
            if result_check and result_check.stdout.strip():
                console.print(f"[yellow]⚠️  Container {CONTAINER_NAME} already exists[/yellow]")
                if Confirm.ask("Remove existing container?", default=True):
                    run_command(f"docker rm -f {CONTAINER_NAME}")
                    console.print(f"[green]✅ Removed existing container {CONTAINER_NAME}[/green]")
                else:
                    console.print("[yellow]Skipping container run[/yellow]")
                    return
            
            # Check if network exists
            network_check = run_command(f"docker network inspect {NETWORK_NAME}")
            network_flag = f"--network {NETWORK_NAME}" if network_check.returncode == 0 else ""
            if network_check.returncode != 0:
                console.print(f"[yellow]⚠️  Network {NETWORK_NAME} not found. Container will use default network.[/yellow]")
                console.print(f"[blue]💡 Create network with: uv run python main.py network create[/blue]")
            
            # Run the container with network
            command = f"docker run -d --name {CONTAINER_NAME} {network_flag} -p {port}:8000 {image_name}"
            console.print(f"[blue]🔄 Starting container {CONTAINER_NAME}...[/blue]")
            
            result_run = run_command(command)
            if result_run and result_run.returncode == 0:
                console.print(f"[green]✅ Container {CONTAINER_NAME} started successfully![/green]")
                console.print(f"[blue]🌐 API available at: http://localhost:{port}[/blue]")
                console.print(f"[blue]📖 Docs available at: http://localhost:{port}/docs[/blue]")
                console.print(f"[blue]🔍 Health check: http://localhost:{port}/health[/blue]")
            else:
                console.print(f"[red]❌ Failed to start container {CONTAINER_NAME}[/red]")
                if result_run and result_run.stderr:
                    console.print(f"[dim red]   {result_run.stderr.strip()}[/dim red]")
    else:
        console.print("[red]❌ Failed to build image[/red]")


@app.command("run")
def run_container(
    tag: str = typer.Option("latest", "--tag", "-t", help="Image tag to run"),
    port: int = typer.Option(8000, "--port", "-p", help="Host port to bind to"),
    name: Optional[str] = typer.Option(None, "--name", "-n", help="Container name (overrides default)"),
    detach: bool = typer.Option(True, "--detach/--no-detach", "-d", help="Run in detached mode")
):
    """🚀 Run FastAPI container with fixed name for networking."""
    image_name = f"{IMAGE_BASE_NAME}:{tag}"
    container_name = name or CONTAINER_NAME  # Use fixed name unless overridden
    
    console.print(Panel.fit(f"🚀 Running FastAPI Container: {container_name}", style="green"))
    
    # Check if image exists
    result = run_command(f"docker images -q {image_name}")
    if not result or not result.stdout.strip():
        console.print(f"[red]❌ Image {image_name} not found[/red]")
        console.print(f"[blue]💡 Build it first with: fastapi build --tag {tag}[/blue]")
        return
    
    # Check if container name already exists
    result = run_command(f"docker ps -a -q -f name={container_name}")
    if result and result.stdout.strip():
        console.print(f"[yellow]⚠️  Container {container_name} already exists[/yellow]")
        if Confirm.ask("Remove existing container?"):
            run_command(f"docker rm -f {container_name}")
        else:
            return
    
    # Check if network exists
    network_check = run_command(f"docker network inspect {NETWORK_NAME}")
    network_flag = f"--network {NETWORK_NAME}" if network_check.returncode == 0 else ""
    if network_check.returncode != 0:
        console.print(f"[yellow]⚠️  Network {NETWORK_NAME} not found. Container will use default network.[/yellow]")
        console.print(f"[blue]💡 Create network with: uv run python main.py network create[/blue]")
    
    detach_flag = "-d" if detach else ""
    command = f"docker run {detach_flag} --name {container_name} {network_flag} -p {port}:8000 {image_name}"
    
    console.print(f"[blue]🔄 Starting container {container_name}...[/blue]")
    console.print(f"[dim]Command: {command}[/dim]")
    
    if detach:
        result = run_command(command)
        if result and result.returncode == 0:
            console.print(f"[green]✅ Container {container_name} started successfully![/green]")
            console.print(f"[blue]🌐 API available at: http://localhost:{port}[/blue]")
            console.print(f"[blue]📖 Docs available at: http://localhost:{port}/docs[/blue]")
            console.print(f"[blue]🔍 Health check: http://localhost:{port}/health[/blue]")
            if network_check.returncode == 0:
                console.print(f"[green]🌐 Container connected to network: {NETWORK_NAME}[/green]")
        else:
            console.print("[red]❌ Failed to start container[/red]")
    else:
        console.print("[yellow]📺 Running in foreground mode (Ctrl+C to stop)...[/yellow]")
        run_command(command, capture_output=False)


@app.command("remove-containers")
def remove_containers():
    """🗑️ Remove FastAPI containers with interactive selection."""
    console.print(Panel.fit("🗑️ Remove FastAPI Containers", style="red"))
    
    containers = get_fastapi_containers()
    if not containers:
        console.print("[yellow]No FastAPI containers found[/yellow]")
        return
    
    display_containers_table(containers)
    
    console.print("\n[bold]Select containers to remove:[/bold]")
    console.print("[dim]Enter numbers separated by commas (e.g., 1,3,5) or 'all' for all containers[/dim]")
    
    selection = Prompt.ask("Your choice", default="")
    
    if not selection:
        console.print("[yellow]No selection made[/yellow]")
        return
    
    containers_to_remove = []
    
    if selection.lower() == "all":
        containers_to_remove = containers
    else:
        try:
            indices = [int(x.strip()) - 1 for x in selection.split(',')]
            containers_to_remove = [containers[i] for i in indices if 0 <= i < len(containers)]
        except (ValueError, IndexError):
            console.print("[red]❌ Invalid selection[/red]")
            return
    
    if not containers_to_remove:
        console.print("[yellow]No valid containers selected[/yellow]")
        return
    
    # Show what will be removed
    console.print("\n[bold red]Containers to remove:[/bold red]")
    for container in containers_to_remove:
        status_indicator = "🟢" if "Up" in container['status'] else "🔴"
        console.print(f"{status_indicator} {container['names']} ({container['id'][:12]})")
    
    if not Confirm.ask("\nProceed with removal?", default=False):
        console.print("[yellow]Operation cancelled[/yellow]")
        return
    
    # Remove containers
    success_count = 0
    container_images = set()  # Track unique images from removed containers
    
    for container in containers_to_remove:
        console.print(f"[blue]🗑️  Removing {container['names']}...[/blue]")
        # Store the image name before removing the container
        container_images.add(container['image'])
        
        result = run_command(f"docker rm -f {container['id']}")
        if result and result.returncode == 0:
            console.print(f"[green]✅ Removed {container['names']}[/green]")
            success_count += 1
        else:
            console.print(f"[red]❌ Failed to remove {container['names']}[/red]")
    
    console.print(f"\n[bold]Removed {success_count}/{len(containers_to_remove)} containers[/bold]")
    
    # Ask if user wants to remove related images
    if success_count > 0 and container_images:
        console.print(f"\n[yellow]Found {len(container_images)} related image(s):[/yellow]")
        for image in sorted(container_images):
            console.print(f"  📦 {image}")
        
        if Confirm.ask("\nDo you want to remove these related images as well?", default=False):
            image_success_count = 0
            for image in container_images:
                console.print(f"[blue]🗑️  Removing image {image}...[/blue]")
                result = run_command(f"docker rmi {image}")
                if result and result.returncode == 0:
                    console.print(f"[green]✅ Removed image {image}[/green]")
                    image_success_count += 1
                else:
                    console.print(f"[red]❌ Failed to remove image {image}[/red]")
                    if result and result.stderr:
                        console.print(f"[dim red]   {result.stderr.strip()}[/dim red]")
            
            console.print(f"\n[bold]Removed {image_success_count}/{len(container_images)} images[/bold]")


@app.command("remove-images")
def remove_images():
    """🗑️ Remove FastAPI images with interactive selection."""
    console.print(Panel.fit("🗑️ Remove FastAPI Images", style="red"))
    
    images = get_fastapi_images()
    if not images:
        console.print("[yellow]No FastAPI images found[/yellow]")
        return
    
    display_images_table(images)
    
    console.print("\n[bold]Select images to remove:[/bold]")
    console.print("[dim]Enter numbers separated by commas (e.g., 1,3,5) or 'all' for all images[/dim]")
    
    selection = Prompt.ask("Your choice", default="")
    
    if not selection:
        console.print("[yellow]No selection made[/yellow]")
        return
    
    images_to_remove = []
    
    if selection.lower() == "all":
        images_to_remove = images
    else:
        try:
            indices = [int(x.strip()) - 1 for x in selection.split(',')]
            images_to_remove = [images[i] for i in indices if 0 <= i < len(images)]
        except (ValueError, IndexError):
            console.print("[red]❌ Invalid selection[/red]")
            return
    
    if not images_to_remove:
        console.print("[yellow]No valid images selected[/yellow]")
        return
    
    # Show what will be removed
    console.print("\n[bold red]Images to remove:[/bold red]")
    for image in images_to_remove:
        console.print(f"🖼️  {image['repository']}:{image['tag']} ({image['id'][:12]})")
    
    if not Confirm.ask("\nProceed with removal?", default=False):
        console.print("[yellow]Operation cancelled[/yellow]")
        return
    
    # Remove images
    success_count = 0
    for image in images_to_remove:
        image_ref = f"{image['repository']}:{image['tag']}"
        console.print(f"[blue]🗑️  Removing {image_ref}...[/blue]")
        result = run_command(f"docker rmi {image['id']}")
        if result and result.returncode == 0:
            console.print(f"[green]✅ Removed {image_ref}[/green]")
            success_count += 1
        else:
            console.print(f"[red]❌ Failed to remove {image_ref}[/red]")
    
    console.print(f"\n[bold]Removed {success_count}/{len(images_to_remove)} images[/bold]")


@app.command("list")
def list_resources():
    """📋 List all FastAPI images and containers."""
    console.print(Panel.fit("📋 FastAPI Resources", style="blue"))
    
    # Show images
    console.print("\n[bold]🖼️  Images:[/bold]")
    images = get_fastapi_images()
    display_images_table(images)
    
    # Show containers
    console.print("\n[bold]🐳 Containers:[/bold]")
    containers = get_fastapi_containers()
    display_containers_table(containers)


@app.command("logs")
def show_logs(
    container: Optional[str] = typer.Option(None, "--container", "-c", help="Container name or ID"),
    follow: bool = typer.Option(False, "--follow", "-f", help="Follow log output"),
    tail: int = typer.Option(50, "--tail", "-n", help="Number of lines to show")
):
    """📋 Show container logs."""
    console.print(Panel.fit("📋 FastAPI Container Logs", style="blue"))
    
    if not container:
        containers = get_fastapi_containers()
        if not containers:
            console.print("[yellow]No FastAPI containers found[/yellow]")
            return
        
        if len(containers) == 1:
            container = containers[0]['names']
        else:
            display_containers_table(containers)
            selection = Prompt.ask("Select container number", default="1")
            try:
                idx = int(selection) - 1
                if 0 <= idx < len(containers):
                    container = containers[idx]['names']
                else:
                    console.print("[red]❌ Invalid selection[/red]")
                    return
            except ValueError:
                console.print("[red]❌ Invalid selection[/red]")
                return
    
    follow_flag = "-f" if follow else ""
    command = f"docker logs {follow_flag} --tail {tail} {container}"
    
    console.print(f"[blue]📄 Showing logs for {container}{'(following)' if follow else ''}...[/blue]")
    run_command(command, capture_output=False)


if __name__ == "__main__":
    app()
