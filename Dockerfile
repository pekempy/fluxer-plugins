# Base stage: SDK, CLI, and loaders
FROM node:24-bookworm-slim AS base

RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

WORKDIR /workspace

# Copy files needed for building
COPY sdk/ ./sdk/
COPY cli/ ./cli/
COPY api-loader/ ./api-loader/
COPY app-loader/ ./app-loader/

# Install dependencies and build SDK + CLI
WORKDIR /workspace/sdk
RUN pnpm install --ignore-workspace && pnpm build

WORKDIR /workspace/cli
RUN pnpm install --ignore-workspace && pnpm build && pnpm link --global

# Set environment
ENV FLUXER_PLUGIN_DIR=/plugins
ENV NODE_ENV=production
WORKDIR /workspace

# Dev stage: watch files and compile automatically
FROM base AS dev
ENV NODE_ENV=development
CMD ["fluxer-plugin", "dev", "--watch"]

# Production stage: minimal runtime entrypoint
FROM base AS prod
CMD ["node", "api-loader/entry.js"]
