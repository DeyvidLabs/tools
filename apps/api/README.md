# Tools API

The NestJS backend for [tools.deyvid.dev](https://tools.deyvid.dev) — a self-hosted collection of dev tools that are **client-side by default**. This app only exists for the handful of tools that genuinely need server-side state: a webhook bin, a paste store, a URL shortener, a mock endpoint, and a WebSocket echo/relay.

**There are no user accounts.** Every endpoint is public — nothing here authenticates a request, stores a profile, or retains any personal data beyond what a tool needs to do its one job (and only for that tool's TTL).

## Features

- Webhook bin capture + inspection, with TTL-based expiry
- Pastebin with optional one-time delete token
- Self-hosted URL shortener
- Configurable mock/sandbox HTTP endpoint
- Raw WebSocket echo/relay tester (solo or shared room)
- PostgreSQL + TypeORM with migration support
- Helmet security headers, per-IP rate limiting, global validation
- Swagger/OpenAPI documentation

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 11 |
| ORM | TypeORM 0.3 |
| Database | PostgreSQL 17 |
| Validation | class-validator + class-transformer |
| Docs | Swagger / OpenAPI |
| Testing | Jest + Supertest |

---

## Project Structure

```
├── database/
│   └── migrations/          # TypeORM migrations
├── src/
│   ├── common/
│   │   ├── dto/              # Shared DTOs
│   │   ├── entities/         # TypeORM entities (WebhookBin, Paste, ShortLink, MockEndpoint, ...)
│   │   ├── filters/          # Global HTTP exception filter
│   │   └── interceptors/
│   ├── modules/
│   │   ├── webhook/           # Webhook bin capture + inspection
│   │   ├── paste/              # Pastebin
│   │   ├── url-shortener/       # URL shortener
│   │   ├── mock-endpoint/        # Configurable mock/sandbox endpoint
│   │   └── ws-tester/             # WebSocket echo/relay gateway
│   ├── app.module.ts
│   └── main.ts
├── test/                    # e2e test suites
├── docker-compose.yml       # PostgreSQL via Docker
├── typeorm.config.ts        # Migration CLI config
└── .env.sample
```

---

## Quick Start

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Configure environment

```bash
cp .env.sample .env
# Edit .env — verify DATABASE_URL, and set PASTE_ADMIN_TOKEN / URL_SHORTENER_ADMIN_TOKEN if you want them
```

### 4. Run migrations

```bash
# Generate (after modifying entities):
yarn migration:generate src/database/migrations/<MigrationName>

# Apply:
yarn migration:run
```

In development, `synchronize: true` is active so the schema is auto-synced without migrations.

### 5. Start the server

```bash
# Development (watch mode)
yarn start:dev

# Production
yarn build && yarn start:prod
```

Swagger UI is available at `http://localhost:5000/docs`.

---

## API Endpoints

All routes below sit behind the global `/api` prefix — the only exception is `/health`. Every route is public.

### Webhook tester (`/api/webhook`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/webhook/bins` | Create a new webhook bin |
| GET | `/api/webhook/bins/:id` | Get a bin's info |
| GET | `/api/webhook/bins/:id/requests` | List captured requests for a bin |
| ANY | `/api/webhook/capture/:id` | Capture endpoint — any method/body lands here |

### Pastebin (`/api/paste`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/paste` | Create a paste |
| GET | `/api/paste/:id` | Read a paste |
| DELETE | `/api/paste/:id` | Delete a paste using its one-time delete token |

### URL shortener

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/shorten` | Create a short link |
| GET | `/api/shorten/:code` | Get a short link's info |
| DELETE | `/api/shorten/:code` | Delete a short link |
| GET | `/api/s/:code` | Redirect to the original URL |

### Mock endpoint (`/api/mock`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/mock/endpoints` | Create a mock endpoint (status, body, headers, delay) |
| GET | `/api/mock/endpoints/:id` | Get a mock endpoint's config |
| DELETE | `/api/mock/endpoints/:id` | Delete a mock endpoint |
| ANY | `/api/mock/hit/:id` | Hit the mock endpoint — responds with its configured status/body/headers/delay |

### WebSocket tester

| Path | Description |
|------|-------------|
| `/api/ws-tester` | Raw WebSocket echo/relay gateway (solo or shared room via query param) |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |

---

## Running Tests

```bash
# Unit tests
yarn test

# Unit tests with coverage
yarn test:cov

# e2e tests (no real database needed — mocked)
yarn test:e2e
```

---

## Migrations

```bash
# Generate a new migration after changing entities
yarn migration:generate src/database/migrations/<MigrationName>

# Apply pending migrations
yarn migration:run

# Revert the last migration
yarn migration:revert

# Show migration status
yarn migration:show
```

---

## Reverse Proxy

The app is meant to run behind a reverse proxy (nginx, Caddy, Traefik...) that terminates TLS. It already trusts the first proxy hop (`app.set('trust proxy', 1)` in `main.ts`), so `req.ip` and the `ThrottlerGuard`'s per-IP rate limiting still work correctly instead of bucketing every client under the proxy's IP.

Both examples below forward the request path unchanged (no rewriting) — since the app already expects everything under `/api` (see [API Endpoints](#api-endpoints)), that's the config with the least room for surprises. This means on the dedicated subdomain the path still includes `/api`, e.g. `api.example.com/api/paste`, not `api.example.com/paste`. You can run either setup alone or both at once against the same backend.

<details>
<summary>Example nginx / Caddy config</summary>

**nginx**

```nginx
# Option 1: dedicated subdomain — api.example.com/api/paste
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000; # no trailing path → forwards the URI as-is
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Option 2: same domain as the frontend, under /api — example.com/api/paste
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location /api/ {
        proxy_pass http://127.0.0.1:5000; # same rule: no trailing path, /api/... passes through as-is
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        proxy_set_header Host $host;
    }

    location /docs {
        proxy_pass http://127.0.0.1:5000/docs;
        proxy_set_header Host $host;
    }

    # ... rest of the site (frontend, etc.)
}
```

**Caddy**

```caddyfile
# Option 1: dedicated subdomain — api.example.com/api/paste
api.example.com {
    reverse_proxy 127.0.0.1:5000
}

# Option 2: same domain as the frontend, under /api — example.com/api/paste
example.com {
    handle /api/* {
        reverse_proxy 127.0.0.1:5000
    }

    handle /health {
        reverse_proxy 127.0.0.1:5000
    }

    handle /docs {
        reverse_proxy 127.0.0.1:5000
    }

    # ... rest of the site (frontend, etc.)
}
```

`/health` and `/docs` sit outside the `/api` prefix (see [API Endpoints](#api-endpoints)), so on the path-based setup they need their own `location`/`handle` block to be reachable from the main domain — otherwise they're only reachable through the dedicated subdomain.

Set `CORS_ORIGIN` to the exact origin(s) serving the frontend, or `*` if that doesn't matter for your deployment.

</details>

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a pull request.

---

## Contact

Deyvid Manolov — [Telegram](https://t.me/FileExists) — [deyvid.dev](https://www.deyvid.dev)
