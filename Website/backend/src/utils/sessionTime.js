const DEFAULT_LATE_THRESHOLD_MINUTES = 10;

// Prisma maps a MySQL @db.Time column to a JS Date anchored at 1970-01-01
// with the correct hours/minutes/seconds. This combines that time-of-day
// with the actual session date to get a real, usable Date.
function combineDateAndTime(date, time) {
  const combined = new Date(date);
  combined.setUTCHours(time.getUTCHours(), time.getUTCMinutes(), time.getUTCSeconds(), 0);
  return combined;
}

/**
 * PRESENT if marked at/before (session start + late threshold), otherwise LATE.
 * Window-open/closed enforcement is a separate concern (AttendanceSession.status,
 * owned by Module 7) — this only classifies punctuality once marking is allowed.
 */
function computeAttendanceStatus(session, markedAt, lateThresholdMinutes = DEFAULT_LATE_THRESHOLD_MINUTES) {
  const sessionStart = combineDateAndTime(session.sessionDate, session.startTime);
  const lateThreshold = new Date(sessionStart.getTime() + lateThresholdMinutes * 60 * 1000);
  return markedAt <= lateThreshold ? 'PRESENT' : 'LATE';
}

// Converts a real Date's wall-clock time into the same 1970-01-01-anchored
// representation Prisma uses for @db.Time columns, so it can be compared
// against stored start_time/end_time values in a query.
function toTimeOfDay(date) {
  return new Date(Date.UTC(1970, 0, 1, date.getHours(), date.getMinutes(), date.getSeconds()));
}

module.exports = { combineDateAndTime, computeAttendanceStatus, toTimeOfDay, DEFAULT_LATE_THRESHOLD_MINUTES };
