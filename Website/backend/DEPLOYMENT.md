# Deployment Guide

## Sandbox verification note

This guide was written in a sandbox with no `docker` binary and no network access to Docker
Hub, so `docker build` / `docker compose up` could **not** be run here. Everything below was
checked as far as this environment allows — YAML syntax validated, the Prisma multi-stage
logic reasoned through carefully (see the comment in `Dockerfile` about why `prisma generate`
needs a separate stage) — but you should run a real `docker compose up --build` in your own
environment before trusting this in production. The database schema and every application
code path *have* been verified for real against a live MySQL instance and real email/PDF/Excel
output (see the test suite and prior module notes) — it's specifically the container build
itself that's unverified here.

## Option A: Docker Compose (recommended)

```bash
cp .env.example .env   # fill in JWT secrets, SMTP credentials
docker compose up --build
```

This starts MySQL (schema + seed auto-applied via `docker-entrypoint-initdb.d`) and the app,
built via the multi-stage `Dockerfile`. App available at `http://localhost:5000`.

## Option B: PM2 (no containers)

```bash
npm ci
npx prisma generate
npx prisma migrate deploy   # or apply prisma/schema.sql directly
npm install -g pm2
pm2 start ecosystem.config.js
```

`ecosystem.config.js` runs in `cluster` mode across all CPU cores. This is safe here because
the API is stateless — auth is JWT (no server-side session store), so any instance can handle
any request with no shared in-memory state between processes.

## Health checks

`GET /health` (no auth) — use for container/load-balancer readiness and liveness probes.

## CI

`.github/workflows/ci.yml` runs the full test suite (`npm test -- --coverage`) on every push/PR
to `main` and uploads the coverage report as a build artifact. No database service container is
needed in CI — every Prisma-touching function is mocked at the repository boundary in tests;
the one test that talks to a real service (`tests/email.service.test.js`) spins up its own
in-process SMTP server rather than depending on external infrastructure.

## Known optimization notes (see also comments in source)

- **Indexes**: composite indexes were added for the actual hot query paths this app makes
  (session resolution by department+status, attendance lookups by user+status, notification
  listing by user+date, timetable slot lookup by department+day) — verified with `EXPLAIN`
  against a live MySQL instance, not just assumed.
- **Compression**: `compression` middleware is on for all responses; PDF/xlsx report downloads
  are automatically skipped by its MIME filter since they're already-compressed binary formats
  (verified directly, not assumed — see `tests/compression.test.js`).
- **`analytics.service.getDepartmentSummary`**: fires 2 queries per user in the department,
  concurrently. Each individual query is index-covered and fast, but for a very large
  department this is still many concurrent round trips. A full batch/groupBy rewrite is
  possible but non-trivial because the denominator's scope differs per role (see
  `src/utils/attendanceScope.js`) — documented as a follow-up rather than risked as a late
  rewrite of already-tested logic.

## Environment variables

See `.env.example` for the full list (DB connection, JWT secrets/expiry, SMTP, rate limits).
