FROM node:18-slim

# Set working directory — dockerService.js mounts code here as /app/solution.js
WORKDIR /app

# No CMD — the run command is injected by dockerService.js via `sh -c node /app/solution.js`
