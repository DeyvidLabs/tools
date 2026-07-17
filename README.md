# tools

[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-8A63D2)](https://claude.ai/code)

A collection of small, self-contained dev tools (password generator, webhook tester, WebSocket tester, Discord embed builder, JWT debugger, cron expression builder, pastebin, and more) — designed to keep everything at hand without relying on third-party services, and fully customizable.

## Structure

pnpm workspaces + Turborepo monorepo:

- `apps/api` — NestJS backend (auth, RBAC, Google OAuth2), used only by tools that need server-side state.
- `apps/web` — Next.js frontend.
- `packages/*` — shared code between `apps/web` and `apps/api`.

## Status

🚧 Structure only — no tool has been implemented yet.

## Commands

```bash
pnpm install
pnpm dev      # turbo run dev
pnpm build    # turbo run build
pnpm lint     # turbo run lint
pnpm test     # turbo run test
```
