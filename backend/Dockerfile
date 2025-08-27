# Multi-stage build for Take Your Time FastAPI API
FROM python:3.13-slim AS dependencies-stage

# Get uv from the official image
COPY --from=ghcr.io/astral-sh/uv:0.7.21 /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Set environment variables for uv
ENV UV_LINK_MODE=copy

# Copy dependency files first for better caching
COPY pyproject.toml uv.lock ./

# Install dependencies with cache mounts
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project

# Copy application code
COPY app/ ./app/
COPY main.py ./

# Sync the project
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked

# Production stage
FROM python:3.13-slim AS production-stage

# Get uv from the official image
COPY --from=ghcr.io/astral-sh/uv:0.7.21 /uv /uvx /bin/

# Install curl for health checks
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    # Env docker file
    ENV_FILE=.env.dev-docker \
    PATH="/app/.venv/bin:$PATH"

# Copy the virtual environment from the dependencies stage
COPY --from=dependencies-stage /app/.venv /app/.venv

# Copy application code from dependencies stage
COPY --from=dependencies-stage /app /app

# Copy environment file
COPY .env.dev-docker ./

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
