# Take Your Time - Docker Management Scripts

🎯 **Comprehensive CLI tools for managing MongoDB and FastAPI containers with rich UI and interactive selection.**

## 🚀 Features

- **Beautiful CLI** with Rich formatting and colors
- **Interactive selection** for container/image management
- **Simple commands** for MongoDB operations
- **Advanced FastAPI management** with tagging and multiple containers
- **Safety confirmations** before destructive operations
- **Comprehensive logging** and status information

## 📁 Structure

```
scripts/
├── main.py                 # Main CLI entry point
├── mongodb/
│   ├── manage.py          # MongoDB container management
│   └── __init__.py
├── fastapi/
│   ├── manage.py          # FastAPI container management
│   └── __init__.py
├── pyproject.toml         # Dependencies (rich, typer)
└── README.md
```

## ⚡ Quick Start

### Install Dependencies
```bash
cd scripts
uv sync
```

### Basic Usage
```bash
# Show help and examples
uv run python main.py info

# MongoDB operations
uv run python main.py mongodb start
uv run python main.py mongodb status
uv run python main.py mongodb stop

# FastAPI operations
uv run python main.py fastapi build --tag v1.0
uv run python main.py fastapi run --tag v1.0
uv run python main.py fastapi list
```

## 🍃 MongoDB Commands

### Simple MongoDB Management
```bash
# Start MongoDB container (creates if not exists)
uv run python main.py mongodb start

# Check status
uv run python main.py mongodb status

# View logs
uv run python main.py mongodb logs

# Stop container
uv run python main.py mongodb stop

# Remove container and data
uv run python main.py mongodb remove --force
```

### MongoDB Features:
- ✅ **Auto-creation** - Creates container if it doesn't exist
- ✅ **Status checking** - Shows running state and connection info
- ✅ **Port 27017** - Standard MongoDB port
- ✅ **Database: TAKE_YOUR_TIME** - Pre-configured database name
- ✅ **Health checks** - Built-in connection testing

## 🚀 FastAPI Commands

### Build & Run
```bash
# Build image with tag
uv run python main.py fastapi build --tag v1.0
uv run python main.py fastapi build --tag latest

# Run container
uv run python main.py fastapi run --tag v1.0 --port 8000
uv run python main.py fastapi run --tag latest --port 8080 --name api-prod
```

### List & Monitor
```bash
# List all images and containers
uv run python main.py fastapi list

# View container logs
uv run python main.py fastapi logs
uv run python main.py fastapi logs --container api-prod --follow
```

### Cleanup (Interactive)
```bash
# Remove containers (interactive selection)
uv run python main.py fastapi remove-containers

# Remove images (interactive selection)  
uv run python main.py fastapi remove-images
```

### FastAPI Features:
- ✅ **Tagged images** - `take-your-time-fastapi:tag`
- ✅ **Multiple containers** - Run different versions simultaneously
- ✅ **Interactive selection** - Choose containers/images from numbered list
- ✅ **Port mapping** - Configurable host ports
- ✅ **Safety confirmations** - Confirm before destructive operations
- ✅ **Rich tables** - Beautiful formatted lists

## 🎯 Complete Workflow Example

```bash
# 1. Start MongoDB
uv run python main.py mongodb start

# 2. Build FastAPI image
uv run python main.py fastapi build --tag v1.0

# 3. Run FastAPI container
uv run python main.py fastapi run --tag v1.0

# 4. Check everything is running
uv run python main.py mongodb status
uv run python main.py fastapi list

# 5. Test the API
curl http://localhost:8000/health
curl http://localhost:8000/docs
```

## 🛠️ Advanced Usage

### Multiple FastAPI Versions
```bash
# Build different versions
uv run python main.py fastapi build --tag v1.0
uv run python main.py fastapi build --tag v2.0
uv run python main.py fastapi build --tag dev

# Run on different ports
uv run python main.py fastapi run --tag v1.0 --port 8000 --name api-v1
uv run python main.py fastapi run --tag v2.0 --port 8001 --name api-v2
uv run python main.py fastapi run --tag dev --port 8002 --name api-dev
```

### Interactive Cleanup
```bash
# Remove specific containers
uv run python main.py fastapi remove-containers
# Shows numbered list, select: 1,3,5 or "all"

# Remove specific images  
uv run python main.py fastapi remove-images
# Shows numbered list, select which to remove
```

### Log Monitoring
```bash
# Follow logs in real-time
uv run python main.py mongodb logs --follow
uv run python main.py fastapi logs --follow --container api-v1

# Show last 100 lines
uv run python main.py mongodb logs --tail 100
```

## 🔧 Configuration

### Image Names
- **MongoDB**: `mongodb` (standard)
- **FastAPI**: `take-your-time-fastapi:tag`

### Default Ports
- **MongoDB**: `27017`
- **FastAPI**: `8000` (configurable)

### Backend Path
- FastAPI builds from: `../backend/` (relative to scripts)
- Dockerfile location: `../backend/Dockerfile`

## 🆘 Troubleshooting

### MongoDB Won't Start
```bash
# Check if port is in use
netstat -an | findstr 27017

# Check Docker status
docker ps -a

# Force remove and recreate
uv run python main.py mongodb remove --force
uv run python main.py mongodb start
```

### FastAPI Build Fails
```bash
# Check backend path exists
ls ../backend/Dockerfile

# Check Docker BuildKit
set DOCKER_BUILDKIT=1
uv run python main.py fastapi build --tag test
```

### Container Conflicts
```bash
# List all containers
uv run python main.py fastapi list

# Remove conflicts
uv run python main.py fastapi remove-containers
```

## 🎨 Rich UI Features

- **🎯 Colored output** - Status indicators and syntax highlighting
- **📋 Tables** - Formatted lists of containers and images
- **🔢 Interactive selection** - Numbered lists for easy selection
- **✅ Confirmations** - Safety prompts before destructive operations
- **📊 Status indicators** - Visual container states (🟢 running, 🔴 stopped)
- **💡 Helpful hints** - Contextual tips and next steps

---

**Happy Container Management! 🐳✨**
