# syntax=docker/dockerfile:1.7
# Dev-mode container: runs the Vite dev server with hot reload.
# Build context is the monorepo root (see docker-compose.yml) so pnpm can
# resolve the workspace lockfile. Source is bind-mounted at runtime, so this
# image only needs rebuilding when dependencies change.

FROM node:22-slim AS dev

RUN corepack enable && corepack prepare pnpm@11.1.1 --activate

WORKDIR /app

COPY . .
RUN pnpm install --filter @superglam/admin... --frozen-lockfile

WORKDIR /app/apps/admin

EXPOSE 5174

CMD ["pnpm", "dev", "--host", "0.0.0.0"]
