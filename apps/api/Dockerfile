FROM node:22-alpine
RUN corepack enable
WORKDIR /repo

# Install first with only manifests, so this layer is cached across source changes
# (pnpm needs every workspace's package.json present to resolve the lockfile).
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

COPY apps/api apps/api
RUN pnpm --filter api build

WORKDIR /repo/apps/api
EXPOSE 5000
CMD ["node", "dist/src/main"]
