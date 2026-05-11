FROM python:3.11-slim

# Set working directory — dockerService.js mounts code here as /app/solution.py
WORKDIR /app

# Disable output buffering so stdout/stderr stream immediately
ENV PYTHONUNBUFFERED=1

# No CMD — the run command is injected by dockerService.js via `sh -c python /app/solution.py`
