FROM node:22-alpine
RUN corepack enable
WORKDIR /repo

# Install first with only manifests, so this layer is cached across source changes
# (pnpm needs every workspace's package.json present to resolve the lockfile).
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile

COPY apps/web apps/web
RUN pnpm --filter web build

WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
