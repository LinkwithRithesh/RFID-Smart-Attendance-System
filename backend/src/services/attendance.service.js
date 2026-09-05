const ApiError = require('../utils/ApiError');
const userRepository = require('../repositories/user.repository');
const attendanceRepository = require('../repositories/attendance.repository');
const sessionRepository = require('../repositories/attendanceSession.repository');
const auditLogRepository = require('../repositories/auditLog.repository');
const notificationService = require('./notification.service');
const logger = require('../config/logger');
const { computeAttendanceStatus } = require('../utils/sessionTime');
const attendanceSessionService = require('./attendanceSession.service');

function toPublicAttendance(attendance) {
  return {
    id: attendance.id,
    sessionId: attendance.sessionId,
    userId: attendance.userId,
    deviceId: attendance.deviceId,
    method: attendance.method,
    status: attendance.status,
    markedAt: attendance.markedAt,
  };
}

/**
 * Implements the spec's flow: RFID Card -> Verify RFID -> [Face Recognition
 * happens on the device before this call] -> Attendance Window Open? ->
 * Already Marked? -> Store Attendance -> Return Success.
 */
async function markAttendanceByRfid(device, rfidCardId) {
  // Verify RFID
  const user = await userRepository.findByRfidCardId(rfidCardId);
  if (!user || !user.isActive) {
    throw new ApiError(400, 'Invalid or inactive RFID card');
  }

  // Attendance Window Open? — resolves an active manual-override session,
  // or auto-opens one from the timetable if the current time falls in a slot.
  const session = await attendanceSessionService.resolveActiveSession(device.departmentId);
  if (!session) {
    throw new ApiError(404, "No open attendance session for this device's department");
  }

  // Already Marked?
  const existing = await attendanceRepository.findAttendance(session.id, user.id);
  if (existing) {
    throw new ApiError(409, 'Attendance already marked for this session');
  }

  // Store Attendance
  const markedAt = new Date();
  const status = computeAttendanceStatus(session, markedAt);

  const attendance = await attendanceRepository.createAttendance({
    sessionId: session.id,
    userId: user.id,
    deviceId: device.id,
    method: 'RFID_FACE',
    status,
    markedAt,
    isSynced: true,
  });

  // Emit real-time event to SSE listeners on this session channel
  const eventBus = require('../utils/eventBus');
  eventBus.emit(`session:${session.id}`, {
    id: String(attendance.id),
    studentId: user.id,
    name: user.fullName || 'Student',
    rollNo: user.email ? user.email.split('@')[0] : String(user.id),
    method: 'RFID (Turnstile)',
    status,
    timestamp: markedAt.toISOString(),
    confidence: 100,
    deviceId: device.id,
  });

  await auditLogRepository.log({
    actorId: user.id,
    action: 'ATTENDANCE_MARKED',
    entityType: 'Attendance',
    entityId: attendance.id,
  });

  // Fire-and-forget: attendance marking has already succeeded and must be
  // returned to the device regardless of whether the confirmation email/push
  // succeeds. Errors are logged, never rethrown into this response.
  notificationService
    .notifyUser(
      user.id,
      'ATTENDANCE_CONFIRMATION',
      'Attendance Marked',
      `Your attendance was marked as ${status} at ${markedAt.toISOString()}.`
    )
    .catch((err) => logger.error('Failed to send attendance confirmation notification', { error: err.message }));

  return toPublicAttendance(attendance);
}

async function markManual({ sessionId, userId, status }, actorId) {
  const session = await sessionRepository.findById(sessionId);
  if (!session) {
    throw new ApiError(404, 'Attendance session not found');
  }

  const existing = await attendanceRepository.findAttendance(sessionId, userId);
  if (existing) {
    throw new ApiError(409, 'Attendance already marked for this session');
  }

  const attendance = await attendanceRepository.createAttendance({
    sessionId,
    userId,
    deviceId: null,
    method: 'MANUAL',
    status,
    markedAt: new Date(),
    isSynced: true,
  });

  await auditLogRepository.log({
    actorId,
    action: 'ATTENDANCE_MARKED_MANUAL',
    entityType: 'Attendance',
    entityId: attendance.id,
  });

  return toPublicAttendance(attendance);
}

async function listSessionAttendance(sessionId) {
  const session = await sessionRepository.findById(sessionId);
  if (!session) {
    throw new ApiError(404, 'Attendance session not found');
  }

  const records = await attendanceRepository.listBySession(sessionId);
  return records.map((r) => ({ ...toPublicAttendance(r), user: r.user }));
}

/**
 * Offline sync: the device caches (rfidCardId, markedAt) pairs while it has
 * no connectivity, then uploads the batch once it reconnects. Each record is
 * validated independently (device is already validated by the auth
 * middleware) — one bad record doesn't block the rest of the batch.
 */
async function syncOfflineRecords(device, records) {
  const results = [];

  for (const record of records) {
    const markedAt = new Date(record.markedAt);

    try {
      const user = await userRepository.findByRfidCardId(record.rfidCardId);
      if (!user || !user.isActive) {
        results.push({ rfidCardId: record.rfidCardId, markedAt: record.markedAt, status: 'FAILED', reason: 'Invalid or inactive RFID card' });
        continue;
      }

      const session = await attendanceSessionService.resolveHistoricalSession(device.departmentId, markedAt);
      if (!session) {
        results.push({ rfidCardId: record.rfidCardId, markedAt: record.markedAt, status: 'FAILED', reason: 'No attendance window was open at that time' });
        continue;
      }

      const existing = await attendanceRepository.findAttendance(session.id, user.id);
      if (existing) {
        results.push({ rfidCardId: record.rfidCardId, markedAt: record.markedAt, status: 'FAILED', reason: 'Attendance already marked for this session' });
        continue;
      }

      const status = computeAttendanceStatus(session, markedAt);
      const attendance = await attendanceRepository.createAttendance({
        sessionId: session.id,
        userId: user.id,
        deviceId: device.id,
        method: 'RFID_FACE',
        status,
        markedAt,
        isSynced: true,
        syncedAt: new Date(),
      });

      await auditLogRepository.log({
        actorId: user.id,
        action: 'ATTENDANCE_SYNCED',
        entityType: 'Attendance',
        entityId: attendance.id,
      });

      results.push({ rfidCardId: record.rfidCardId, markedAt: record.markedAt, status: 'SYNCED', attendanceId: attendance.id });
    } catch (err) {
      results.push({ rfidCardId: record.rfidCardId, markedAt: record.markedAt, status: 'FAILED', reason: 'Unexpected error processing this record' });
    }
  }

  return {
    total: records.length,
    synced: results.filter((r) => r.status === 'SYNCED').length,
    failed: results.filter((r) => r.status === 'FAILED').length,
    results,
  };
}

module.exports = { markAttendanceByRfid, markManual, listSessionAttendance, syncOfflineRecords };
