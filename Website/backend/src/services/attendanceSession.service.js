const ApiError = require('../utils/ApiError');
const sessionRepository = require('../repositories/attendanceSession.repository');
const timetableRepository = require('../repositories/timetable.repository');
const auditLogRepository = require('../repositories/auditLog.repository');
const { combineDateAndTime, toTimeOfDay } = require('../utils/sessionTime');
const { dayOfWeekFor } = require('../utils/dayOfWeek');
const { outranks } = require('../utils/overrideRank');

const DEFAULT_MANUAL_DURATION_MINUTES = 60;

function isExpired(session, now) {
  const sessionEnd = combineDateAndTime(session.sessionDate, session.endTime);
  return now > sessionEnd;
}

async function closeExpiredSessions(departmentId, now) {
  const openSessions = await sessionRepository.findAllOpenForDepartment(departmentId);
  const expired = openSessions.filter((s) => isExpired(s, now));
  await Promise.all(expired.map((s) => sessionRepository.closeSession(s.id, 'CLOSED')));
  return openSessions.filter((s) => !expired.includes(s));
}

/**
 * The core of the timetable engine: close anything that's timed out, return
 * whatever's still legitimately open (manual override or a previous
 * auto-open), or auto-open a new CLASS session if the current time falls
 * inside a timetable slot for this department. Returns null if no window
 * should be open at all.
 */
async function resolveActiveSession(departmentId, now = new Date()) {
  const stillOpen = await closeExpiredSessions(departmentId, now);
  if (stillOpen.length > 0) {
    return stillOpen[0];
  }

  const dayOfWeek = dayOfWeekFor(now);
  const timeOfDay = toTimeOfDay(now);
  const slot = await timetableRepository.findSlotCoveringNow(departmentId, dayOfWeek, timeOfDay);
  if (!slot) {
    return null;
  }

  return sessionRepository.create({
    sessionType: 'CLASS',
    timetableId: slot.id,
    subjectId: slot.subjectId,
    facultyId: slot.facultyId,
    departmentId,
    sessionDate: now,
    startTime: slot.startTime,
    endTime: slot.endTime,
    status: 'OPEN',
    overrideType: 'NONE',
  });
}

/**
 * Manual override open, restricted to HOD/DEAN/ADMINISTRATOR (the roles the
 * spec's hierarchy names). If a session is already open for the department,
 * the caller's effective rank must strictly outrank it, or the request is
 * rejected — this is what enforces Emergency > Dean > Admin > HOD > Automatic.
 */
async function openManualSession({ departmentId, subjectId, facultyId, durationMinutes, isEmergency }, actor, now = new Date()) {
  const overrideType = isEmergency ? 'EMERGENCY' : actor.role;

  const existing = await closeExpiredSessions(departmentId, now);
  if (existing.length > 0) {
    const current = existing[0];
    if (!outranks(overrideType, current.overrideType)) {
      throw new ApiError(
        409,
        `An equal or higher priority session (${current.overrideType}) is already active for this department`
      );
    }
    await sessionRepository.closeSession(current.id, 'CANCELLED');
  }

  const duration = durationMinutes || DEFAULT_MANUAL_DURATION_MINUTES;
  const endTime = new Date(now.getTime() + duration * 60 * 1000);

  const session = await sessionRepository.create({
    sessionType: subjectId ? 'CLASS' : 'EVENT',
    subjectId: subjectId || null,
    facultyId: facultyId || null,
    departmentId,
    sessionDate: now,
    startTime: toTimeOfDay(now),
    endTime: toTimeOfDay(endTime),
    status: 'OPEN',
    overrideType,
    openedBy: actor.id,
  });

  await auditLogRepository.log({
    actorId: actor.id,
    action: isEmergency ? 'ATTENDANCE_SESSION_EMERGENCY_OPENED' : 'ATTENDANCE_SESSION_MANUAL_OPENED',
    entityType: 'AttendanceSession',
    entityId: session.id,
  });

  return session;
}

async function closeSessionManually(sessionId, actor) {
  const session = await sessionRepository.findById(sessionId);
  if (!session) {
    throw new ApiError(404, 'Attendance session not found');
  }
  if (session.status !== 'OPEN') {
    throw new ApiError(409, 'Session is not open');
  }

  if (session.overrideType !== 'NONE' && !outranks(actor.role, session.overrideType)) {
    throw new ApiError(403, `You do not have sufficient priority to close a ${session.overrideType} session`);
  }

  const closed = await sessionRepository.closeSession(sessionId, 'CLOSED');

  await auditLogRepository.log({
    actorId: actor.id,
    action: 'ATTENDANCE_SESSION_CLOSED',
    entityType: 'AttendanceSession',
    entityId: sessionId,
  });

  return closed;
}

/**
 * Read-mostly historical lookup used by offline sync: what session (if any)
 * covered this department at a *past* timestamp? Unlike resolveActiveSession,
 * this never auto-closes anything based on "now" — a synced record's window
 * is validated against what should have been open back then, not the
 * present moment. If no session was ever created live (e.g. this was the
 * only device at that location and it was offline the whole time), we
 * backfill one from the timetable so the record has a session to attach to.
 */
async function resolveHistoricalSession(departmentId, timestamp) {
  const sessionDate = new Date(Date.UTC(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate()));
  const timeOfDay = toTimeOfDay(timestamp);

  const existing = await sessionRepository.findSessionCoveringTimestamp(departmentId, sessionDate, timeOfDay);
  if (existing) {
    return existing;
  }

  const dayOfWeek = dayOfWeekFor(timestamp);
  const slot = await timetableRepository.findSlotCoveringNow(departmentId, dayOfWeek, timeOfDay);
  if (!slot) {
    return null;
  }

  return sessionRepository.create({
    sessionType: 'CLASS',
    timetableId: slot.id,
    subjectId: slot.subjectId,
    facultyId: slot.facultyId,
    departmentId,
    sessionDate,
    startTime: slot.startTime,
    endTime: slot.endTime,
    status: 'CLOSED', // backfilled after the fact, not a live window
    overrideType: 'NONE',
  });
}

module.exports = { resolveActiveSession, openManualSession, closeSessionManually, resolveHistoricalSession };
