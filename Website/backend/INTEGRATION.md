# Frontend ↔ Backend Integration

## Overview

The frontend talks to the real Express/MySQL backend over `NEXT_PUBLIC_API_URL` (see `.env.local.example`). Auth is real email + password login against seeded users — there is no passwordless or bypass login mode.

### 1. Role Model Alignment
The backend natively defines 8 roles (`STUDENT`, `FACULTY`, `HOD`, `DEAN`, `ADMINISTRATOR`, `SECURITY`, `OFFICE_STAFF`, `LAB_ASSISTANT`). The frontend implements a 3-role navigation shell: **Student, Faculty, Admin**.
- `HOD`, `DEAN`, `ADMINISTRATOR` map to `effectiveRole: "ADMIN"`
- `FACULTY` maps to `effectiveRole: "FACULTY"`
- `STUDENT` maps to `effectiveRole: "STUDENT"`
- `POST /api/v1/auth/login` and `GET /api/v1/auth/me` return `{ ...user, effectiveRole: "ADMIN" | "FACULTY" | "STUDENT" }`.
- Route guards in `authorize.js` accept both raw database role strings and effective role aliases.

### 2. Real-Time Transport (SSE)
- **Live Class Session Stream**: `GET /api/v1/attendance-sessions/:id/stream` (Server-Sent Events)
  - Transmits live attendance markings:
    ```json
    {
      "id": "1001",
      "studentId": 5,
      "name": "RITHESHWARAN A",
      "rollNo": "2025105002",
      "method": "RFID (Turnstile)",
      "status": "PRESENT",
      "timestamp": "2026-09-04T07:15:00.000Z",
      "confidence": 100,
      "deviceId": 7
    }
    ```
- **Live Device Telemetry Stream**: `GET /api/v1/devices/telemetry/stream` (Server-Sent Events)
  - Transmits real-time device heartbeats and status changes:
    ```json
    {
      "id": 7,
      "deviceCode": "ESP32-NODE-01",
      "status": "ONLINE",
      "secondsSinceHeartbeat": 8,
      "firmwareVersion": "v2.1.0"
    }
    ```
- **Fallback Polling**: `GET /api/v1/attendance-sessions/:id/events?since=<cursor>` for networks that buffer HTTP streams.
- **Process Architecture (Option B)**:
  The real-time SSE stream is served from a dedicated single-instance process (`ecosystem.config.js` runs `instances: 1, exec_mode: 'fork'`) ensuring all connections and internal `eventBus` emitters reside in memory without cross-worker IPC dropping. (If scaling horizontally across nodes in future, back `eventBus` with Redis Pub/Sub).

### 3. Device Staleness & Hardware Operations
- **Staleness Contract**: Devices with `secondsSinceHeartbeat <= 30` are `ONLINE`; otherwise `OFFLINE`.
- **Single Header Scheme**: Devices authenticate via `X-Device-Code` and `X-Device-Api-Key`.
- **Dedicated Rate Limiter**: IoT turnstiles operate under a 300 req/min rate limiter.
- **Hardware Operations**:
  - `POST /api/v1/devices/:id/restart` (ADMIN only)
  - `POST /api/v1/devices/:id/test-buzzer` (ADMIN only)

### 4. Deterministic Attendance Analytics Math
All attendance metrics are pre-calculated server-side:
- `percentage = round((attended / held) * 100, 1)` (if held === 0, percentage is 100)
- `streak = consecutive PRESENT/LATE/OD records from latest backwards`
- `safeMisses = max(0, floor(attended - 0.75 * held) / 0.75)`
- `requiredTo75 = max(0, ceil((0.75 * held - attended) / 0.25))`
- Endpoints:
  - `GET /api/v1/attendance/summary`
  - `GET /api/v1/attendance/subjects`
  - `GET /api/v1/attendance/calendar`
  - `POST /api/v1/attendance/verify-face`
  - `GET /api/v1/reports/statement`
  - `GET /api/v1/reports/statement/export?format=csv|pdf`

### 5. On-Duty (OD) Role-Gated Lifecycle
- `POST /api/v1/od-requests` — Student submits application.
- `PATCH /api/v1/od-requests/:id/status`:
  - `FACULTY_APPROVED`: strictly requires `effectiveRole === 'FACULTY'` (403 otherwise).
  - `APPROVED` / `REJECTED`: strictly requires `effectiveRole === 'ADMIN'` (403 otherwise).
- Automatically triggers student email notification upon decision.

### 6. Critical Notification Triggers
1. **Low Attendance Alert**: `< 75%` triggers `LOW_ATTENDANCE_ALERT` notifications.
2. **OD Status Change**: Transition to `FACULTY_APPROVED`, `APPROVED`, or `REJECTED` notifies student.
3. **Mid-Session Device Offline**: Device dropping offline during an active class session alerts faculty.

### 7. Biometric Data Protection
Biometric face embeddings (`face_embedding_path`) and uploaded documents are strictly served via authenticated, authorized controller endpoints with MIME validation and authorization guards. No upload directories are statically exposed via `express.static`.
