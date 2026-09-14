# Smart Campus Attendance Management System — Backend

Node.js/Express/MySQL/Prisma backend, built module by module across 12 modules. See
`DEPLOYMENT.md` for running it, and `docs/README.md` for API docs (Swagger + Postman).

## Quick start

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL, JWT secrets, SMTP
npx prisma generate
mysql -u root < prisma/schema.sql
mysql -u root smart_campus_attendance < prisma/seed.sql        # seeds the 10 fixed roles
mysql -u root smart_campus_attendance < prisma/seed-admin.sql  # bootstrap admin account (see the file for credentials)
npm start
```

Then visit `http://localhost:5000/api-docs` for Swagger UI, or import
`docs/postman/postman_collection.json` into Postman.

## Running tests

```bash
npm test                    # 154 tests
npm test -- --coverage      # + coverage report (93% statements, 83% branches)
```

## What was built, module by module

1. **Project init** — Express skeleton, Winston logging, centralized error handling, standard response envelope
2. **Prisma schema & MySQL DB** — 23 tables, verified against a real MySQL instance (constraints, cascades, the circular department-HOD FK)
3. **Auth (JWT + RBAC)** — access/refresh tokens with rotation and reuse detection, `authenticate`/`authorize` middleware reused by every later module
4. **User & role management** — 10 role-specific profile tables, discriminated-union validation per role
5. **Device management** — API-key auth for ESP32 terminals (separate from user JWT), live `isOnline` derived from heartbeat recency
6. **Attendance engine** — RFID-window check-duplicate check-store flow (face recognition itself is out of scope — no CV library in the stack, trusted to the device)
7. **Timetable & attendance sessions** — auto-open/auto-close engine, manual override hierarchy (Emergency > Dean > Admin > HOD > Automatic)
8. **Offline sync** — retroactive window validation for past timestamps, with session backfill from the timetable when nothing was created live
9. **Reports & analytics** — role-scoped attendance percentage, PDF/Excel export (byte-level verified, not just "runs without erroring")
10. **Notifications & email** — real SMTP integration tested against a local test server; push notifications honestly stubbed (no FCM credentials in scope)
11. **API docs** — OpenAPI spec validated by a real parser; Postman collection generated from the spec so the two can't drift apart
12. **Testing, optimization, deployment** — composite indexes verified with `EXPLAIN`, compression verified to skip already-compressed report formats, multi-stage Dockerfile, PM2 config, CI workflow

## Honest limitations, all flagged inline where they occur

- Prisma's CLI (`generate`/`migrate`) couldn't run in the sandbox this was built in (blocked engine download) — the schema was verified directly against live MySQL instead; run `npx prisma generate` in your own environment before first use.
- `docker build` couldn't be run in the sandbox either (no Docker, no Docker Hub access) — the Dockerfile's logic was reasoned through carefully (see its comments), but test-build it yourself before relying on it in production.
- No student-enrollment table exists in the schema, so per-subject attendance percentage is a department/faculty/worker-shift proxy, not exact (see `src/utils/attendanceScope.js`).
- `getDepartmentSummary` has a documented N+1-ish scaling limitation for very large departments (see `DEPLOYMENT.md`).
