# tools

[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-8A63D2)](https://claude.ai/code)
[![CI](https://github.com/DeyvidLabs/tools/actions/workflows/ci.yml/badge.svg)](https://github.com/DeyvidLabs/tools/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A collection of small, self-contained dev tools — designed to keep everything at hand without relying on third-party services, and fully customizable. Most tools run entirely client-side; a couple use the bundled backend only where server-side state is actually required.

## Tools

| Tool | Status |
|---|---|
| Password Generator | ✅ |
| Webhook Tester | SOON |
| WebSocket Tester | SOON |
| Discord Embed Builder | SOON |
| JWT Debugger | SOON |
| Cron Expression Builder | SOON |
| Pastebin | SOON |

## Structure

pnpm workspaces + Turborepo monorepo:

- `apps/api` — NestJS backend (auth, RBAC, Google OAuth2), used only by tools that need server-side state.
- `apps/web` — Next.js frontend. Each tool lives under `apps/web/app/<tool-name>/`, with its pure logic in a `lib.ts` (unit-tested) separate from the React UI.
- `packages/*` — shared code between `apps/web` and `apps/api`.

## Commands

```bash
pnpm install
pnpm dev         # turbo run dev
pnpm build       # turbo run build
pnpm lint        # turbo run lint
pnpm typecheck   # turbo run typecheck
pnpm test        # turbo run test
```

CI runs lint, typecheck, and tests on every push and pull request.

## License

MIT — see [LICENSE](LICENSE).
