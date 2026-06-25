# Dockerfile for Fluxer Admin Plugin Proxy
FROM node:24-bookworm-slim

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /workspace

# Copy the local SDK and admin-proxy directories
COPY sdk/ ./sdk/
COPY admin-proxy/ ./admin-proxy/

# Navigate to the proxy folder, install dependencies ignoring monorepo catalogs, and compile
WORKDIR /workspace/admin-proxy
RUN pnpm install --ignore-workspace
RUN pnpm build

# Expose proxy port
EXPOSE 3020

# Command to run the proxy server
CMD ["pnpm", "start"]
