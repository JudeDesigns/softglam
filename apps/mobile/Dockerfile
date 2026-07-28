# syntax=docker/dockerfile:1.7
# Dev-mode container: runs the Expo dev server. Uses --tunnel so phones can
# connect via Expo's relay regardless of the host's LAN/firewall setup — this
# avoids the container-networking problems that plague LAN mode in Docker.
# Build context is the monorepo root (see docker-compose.yml).

FROM node:22-slim AS dev

RUN corepack enable && corepack prepare pnpm@11.1.1 --activate

WORKDIR /app

COPY . .
RUN pnpm install --filter @softglow/mobile... --frozen-lockfile

WORKDIR /app/apps/mobile

# Metro (8081) + Expo dev tools (8082/19000-19002 depending on SDK).
EXPOSE 8081

CMD ["pnpm", "start", "--tunnel"]
