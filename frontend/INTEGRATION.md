# Frontend ↔ Backend Integration

## Overview

The frontend (`services/api.ts`) talks to the real Express/MySQL backend over
`NEXT_PUBLIC_API_URL` (see `.env.local.example`). Auth is real email +
password login against seeded users — there is no passwordless or bypass
login mode.

**Frontend pages, all consuming the real backend:**
- `/login` — sign-in form, redirects to `/dashboard` if already authenticated
- `/dashboard` — role-aware overview (own attendance % for everyone; institution-wide stats for ADMIN)
- `/students`, `/faculty` — directories via `useStudents` + `DataTable` (ADMIN/FACULTY only)
- `/attendance` — own attendance %, plus a manual-marking form for ADMIN/FACULTY (`POST /attendance/manual`)
- `/devices` — device list, register-device form, maintenance toggle (ADMIN only)
- `/analytics` — department analytics + low-attendance breakdown (ADMIN/FACULTY only)
- `/reports` — PDF/Excel report downloads, fetched as authenticated blobs
- `/timetable` — timetable slots for the department
- `/downloads` — document list, file upload (Multer) and authenticated download-as-blob
- `/settings` — profile display, theme toggle, logout

## Running both together

```bash
# Backend
cd backend
npm install && npx prisma generate
mysql -u root < prisma/schema.sql
mysql -u root smart_campus_attendance < prisma/seed.sql        # 10 fixed roles
mysql -u root smart_campus_attendance < prisma/seed-admin.sql  # bootstrap admin account
npm start   # http://localhost:5000

# Frontend
cd frontend
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
npm run dev   # http://localhost:3000
```

Visit `http://localhost:3000` — it redirects to `/login`. Sign in with the
bootstrap admin account created by `seed-admin.sql` (see that file for the
credentials), then use the Users module to create real student, faculty, and
staff accounts. Change or remove the bootstrap admin's password afterwards.

## Known gaps (also documented inline in services/api.ts)

- `createUser`/`createDevice`: department is mapped via a hardcoded `{CSE: 1}` lookup — there is no "list departments" endpoint yet, so the mapping only reliably covers the one seeded department.
- `getAttendance` (flat, filterable log) has no backend equivalent — the backend is session-scoped (`GET /attendance/sessions/:sessionId`). The Attendance page shows own-percentage + manual marking instead of a flat log.
- `getDepartmentAnalytics`/reports return the backend's real per-user table and averages (Module 9), not a departmentDistribution/monthlyTrend/heatmap chart shape — no backend endpoint produces that shape yet.
- Password reset has no backend implementation, so the login screen does not offer a forgot-password flow.
- `pingDevice` (admin-triggered) has no backend equivalent — only the device itself can send a heartbeat with its own API key, so there is no ping button on the Devices page.
