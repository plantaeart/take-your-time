#!/usr/bin/env python3
"""
MongoDB Docker Container Management Script
Simple commands to run, create, and stop MongoDB container.
"""
import typer
import subprocess
import sys
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from typing import Optional

app = typer.Typer(
    name="mongodb",
    help="🍃 MongoDB Docker Container Management",
    add_completion=False
)
console = Console()

MONGODB_IMAGE = "mongo:7.0"
CONTAINER_NAME = "mongodb"
PORT = "27017"
DATABASE_NAME = "TAKE_YOUR_TIME"
VOLUME_NAME = "mongodb_data"


def run_command(command: str, capture_output: bool = True) -> subprocess.CompletedProcess:
    """Run a shell command and return the result."""
    try:
        if capture_output:
            result = subprocess.run(
                command.split(),
                capture_output=True,
                text=True,
                check=False
            )
        else:
            result = subprocess.run(command.split(), check=False)
        return result
    except Exception as e:
        console.print(f"[red]❌ Error running command: {e}[/red]")
        return None


def is_container_running() -> bool:
    """Check if MongoDB container is running."""
    result = run_command(f"docker ps -q -f name={CONTAINER_NAME}")
    return result and result.stdout.strip() != ""


def container_exists() -> bool:
    """Check if MongoDB container exists (running or stopped)."""
    result = run_command(f"docker ps -a -q -f name={CONTAINER_NAME}")
    return result and result.stdout.strip() != ""


@app.command("start")
def start_mongodb(
    detach: bool = typer.Option(True, "--detach/--no-detach", "-d", help="Run in detached mode")
):
    """🚀 Start MongoDB container."""
    console.print(Panel.fit("🍃 Starting MongoDB Container", style="green"))
    
    if is_container_running():
        console.print("[yellow]⚠️  MongoDB container is already running![/yellow]")
        console.print(f"[blue]📍 Connection: mongodb://localhost:{PORT}[/blue]")
        console.print(f"[blue]🗄️  Database: {DATABASE_NAME}[/blue]")
        return
    
    if container_exists():
        # Container exists but is stopped, start it
        console.print("[blue]🔄 Starting existing MongoDB container...[/blue]")
        result = run_command(f"docker start {CONTAINER_NAME}")
        if result and result.returncode == 0:
            console.print("[green]✅ MongoDB container started successfully![/green]")
        else:
            console.print("[red]❌ Failed to start MongoDB container[/red]")
            return
    else:
        # Create and start new container
        console.print("[blue]🏗️  Creating new MongoDB container...[/blue]")
        detach_flag = "-d" if detach else ""
        # Add volume for data persistence
        command = f"docker run {detach_flag} --name {CONTAINER_NAME} -p {PORT}:{PORT} -v {VOLUME_NAME}:/data/db -e MONGO_INITDB_DATABASE={DATABASE_NAME} {MONGODB_IMAGE}"
        
        if detach:
            result = run_command(command)
            if result and result.returncode == 0:
                console.print("[green]✅ MongoDB container created and started![/green]")
            else:
                console.print("[red]❌ Failed to create MongoDB container[/red]")
                return
        else:
            console.print("[yellow]📺 Running in foreground mode (Ctrl+C to stop)...[/yellow]")
            run_command(command, capture_output=False)
            return
    
    # Show connection info
    console.print("\n[bold green]🎉 MongoDB is ready![/bold green]")
    console.print(f"[blue]📍 Connection: mongodb://localhost:{PORT}[/blue]")
    console.print(f"[blue]🗄️  Database: {DATABASE_NAME}[/blue]")
    console.print("[blue]🔍 Test: docker exec mongodb mongosh --eval 'db.runCommand({ping: 1})'[/blue]")


@app.command("stop")
def stop_mongodb():
    """🛑 Stop MongoDB container."""
    console.print(Panel.fit("🛑 Stopping MongoDB Container", style="red"))
    
    if not is_container_running():
        console.print("[yellow]⚠️  MongoDB container is not running[/yellow]")
        return
    
    console.print("[blue]🔄 Stopping MongoDB container...[/blue]")
    result = run_command(f"docker stop {CONTAINER_NAME}")
    
    if result and result.returncode == 0:
        console.print("[green]✅ MongoDB container stopped successfully![/green]")
    else:
        console.print("[red]❌ Failed to stop MongoDB container[/red]")


@app.command("status")
def status_mongodb():
    """📊 Check MongoDB container status."""
    console.print(Panel.fit("📊 MongoDB Container Status", style="blue"))
    
    if is_container_running():
        console.print("[green]✅ MongoDB container is running[/green]")
        console.print(f"[blue]📍 Connection: mongodb://localhost:{PORT}[/blue]")
        console.print(f"[blue]🗄️  Database: {DATABASE_NAME}[/blue]")
        
        # Show container details
        result = run_command(f"docker ps --filter name={CONTAINER_NAME} --format 'table {{.ID}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}'")
        if result and result.stdout:
            console.print("\n[bold]Container Details:[/bold]")
            console.print(result.stdout.strip())
    elif container_exists():
        console.print("[yellow]⚠️  MongoDB container exists but is stopped[/yellow]")
        console.print("[blue]💡 Use 'mongodb start' to start it[/blue]")
    else:
        console.print("[red]❌ MongoDB container does not exist[/red]")
        console.print("[blue]💡 Use 'mongodb start' to create and start it[/blue]")


@app.command("remove")
def remove_mongodb(
    force: bool = typer.Option(False, "--force", "-f", help="Force remove running container"),
    keep_data: bool = typer.Option(True, "--keep-data/--remove-data", help="Keep persistent data volume")
):
    """🗑️  Remove MongoDB container and optionally data."""
    console.print(Panel.fit("🗑️ Removing MongoDB Container", style="red"))
    
    if not container_exists():
        console.print("[yellow]⚠️  MongoDB container does not exist[/yellow]")
        return
    
    if is_container_running() and not force:
        console.print("[red]❌ MongoDB container is running[/red]")
        console.print("[blue]💡 Stop it first with 'mongodb stop' or use --force[/blue]")
        return
    
    if is_container_running() and force:
        console.print("[blue]🔄 Force stopping MongoDB container...[/blue]")
        run_command(f"docker stop {CONTAINER_NAME}")
    
    console.print("[blue]🗑️  Removing MongoDB container...[/blue]")
    result = run_command(f"docker rm {CONTAINER_NAME}")
    
    if result and result.returncode == 0:
        console.print("[green]✅ MongoDB container removed successfully![/green]")
        
        if keep_data:
            console.print(f"[green]💾 Data volume '{VOLUME_NAME}' preserved[/green]")
            console.print("[blue]💡 Your data will be restored when you start a new container[/blue]")
        else:
            console.print("[blue]🗑️  Removing data volume...[/blue]")
            volume_result = run_command(f"docker volume rm {VOLUME_NAME}")
            if volume_result and volume_result.returncode == 0:
                console.print("[green]✅ Data volume removed successfully![/green]")
                console.print("[yellow]⚠️  All persistent data has been permanently deleted[/yellow]")
            else:
                console.print("[yellow]⚠️  Failed to remove data volume (may not exist)[/yellow]")
    else:
        console.print("[red]❌ Failed to remove MongoDB container[/red]")


@app.command("volume-info")
def volume_info():
    """💾 Show MongoDB data volume information."""
    console.print(Panel.fit("💾 MongoDB Data Volume Info", style="blue"))
    
    # Check if volume exists
    result = run_command(f"docker volume ls -q -f name={VOLUME_NAME}")
    
    if result and result.stdout.strip():
        console.print(f"[green]✅ Data volume '{VOLUME_NAME}' exists[/green]")
        
        # Get volume details
        inspect_result = run_command(f"docker volume inspect {VOLUME_NAME}")
        if inspect_result and inspect_result.returncode == 0:
            import json
            try:
                volume_data = json.loads(inspect_result.stdout)[0]
                mountpoint = volume_data.get('Mountpoint', 'Unknown')
                created = volume_data.get('CreatedAt', 'Unknown')
                console.print(f"[blue]📍 Location: {mountpoint}[/blue]")
                console.print(f"[blue]📅 Created: {created}[/blue]")
            except:
                console.print("[yellow]⚠️  Could not parse volume details[/yellow]")
        
        # Show volume size if possible
        size_result = run_command(f"docker system df -v")
        if size_result and size_result.returncode == 0 and VOLUME_NAME in size_result.stdout:
            console.print("[blue]📊 Use 'docker system df -v' to see volume size[/blue]")
        
        console.print("[green]💡 Your MongoDB data persists across container restarts[/green]")
    else:
        console.print(f"[yellow]⚠️  Data volume '{VOLUME_NAME}' does not exist[/yellow]")
        console.print("[blue]💡 Volume will be created when you start MongoDB[/blue]")


@app.command("logs")
def logs_mongodb(
    follow: bool = typer.Option(False, "--follow", "-f", help="Follow log output"),
    tail: int = typer.Option(50, "--tail", "-n", help="Number of lines to show from the end")
):
    """📋 Show MongoDB container logs."""
    console.print(Panel.fit("📋 MongoDB Container Logs", style="blue"))
    
    if not container_exists():
        console.print("[red]❌ MongoDB container does not exist[/red]")
        return
    
    follow_flag = "-f" if follow else ""
    command = f"docker logs {follow_flag} --tail {tail} {CONTAINER_NAME}"
    
    console.print(f"[blue]📄 Showing last {tail} lines{'(following)' if follow else ''}...[/blue]")
    run_command(command, capture_output=False)


@app.command("clear-database")
def clear_database(
    confirm: bool = typer.Option(False, "--confirm", "-y", help="Skip confirmation prompt")
):
    """🗑️ Clear all data from the MongoDB database."""
    console.print(Panel.fit("🗑️ Clear MongoDB Database", style="red"))
    
    if not is_container_running():
        console.print("[red]❌ MongoDB container is not running[/red]")
        console.print("[blue]💡 Start it first with 'mongodb start'[/blue]")
        return
    
    # Confirmation prompt
    if not confirm:
        console.print(f"[yellow]⚠️  This will permanently delete ALL data in database: {DATABASE_NAME}[/yellow]")
        console.print("[yellow]Collections that will be cleared:[/yellow]")
        console.print("  • users")
        console.print("  • products") 
        console.print("  • carts")
        console.print("  • wishlists")
        console.print("  • token_blacklist")
        console.print("  • user_token_invalidation")
        
        confirmation = typer.confirm("Are you sure you want to continue?")
        if not confirmation:
            console.print("[blue]🚫 Operation cancelled[/blue]")
            return
    
    console.print("[blue]🔄 Clearing database...[/blue]")
    
    # MongoDB commands to clear all collections
    commands = [
        f"docker exec {CONTAINER_NAME} mongosh {DATABASE_NAME} --eval 'db.users.deleteMany({{}})'",
        f"docker exec {CONTAINER_NAME} mongosh {DATABASE_NAME} --eval 'db.products.deleteMany({{}})'",
        f"docker exec {CONTAINER_NAME} mongosh {DATABASE_NAME} --eval 'db.carts.deleteMany({{}})'",
        f"docker exec {CONTAINER_NAME} mongosh {DATABASE_NAME} --eval 'db.wishlists.deleteMany({{}})'",
        f"docker exec {CONTAINER_NAME} mongosh {DATABASE_NAME} --eval 'db.token_blacklist.deleteMany({{}})'",
        f"docker exec {CONTAINER_NAME} mongosh {DATABASE_NAME} --eval 'db.user_token_invalidation.deleteMany({{}})'",
    ]
    
    success_count = 0
    for command in commands:
        collection_name = command.split('db.')[1].split('.deleteMany')[0]
        console.print(f"[blue]  Clearing {collection_name}...[/blue]")
        
        result = run_command(command)
        if result and result.returncode == 0:
            # Parse the output to show how many documents were deleted
            if "deletedCount" in result.stdout:
                try:
                    import re
                    match = re.search(r'"deletedCount"\s*:\s*(\d+)', result.stdout)
                    if match:
                        deleted_count = match.group(1)
                        console.print(f"[green]    ✅ {collection_name}: {deleted_count} documents deleted[/green]")
                    else:
                        console.print(f"[green]    ✅ {collection_name}: cleared[/green]")
                except:
                    console.print(f"[green]    ✅ {collection_name}: cleared[/green]")
            else:
                console.print(f"[green]    ✅ {collection_name}: cleared[/green]")
            success_count += 1
        else:
            console.print(f"[red]    ❌ Failed to clear {collection_name}[/red]")
    
    if success_count == len(commands):
        console.print(f"\n[bold green]🎉 Database '{DATABASE_NAME}' cleared successfully![/bold green]")
        console.print("[blue]💡 The application will create fresh data on next startup[/blue]")
    else:
        console.print(f"\n[yellow]⚠️  Partially completed: {success_count}/{len(commands)} collections cleared[/yellow]")


if __name__ == "__main__":
    app()
