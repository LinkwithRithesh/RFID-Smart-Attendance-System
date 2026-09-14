const prisma = require('../config/database');

function findById(id) {
  return prisma.attendanceSession.findUnique({ where: { id } });
}

// Known limitation: if a department somehow has more than one OPEN session
// at once (e.g. two rooms in session simultaneously), this takes the most
// recently opened one. Disambiguating by room would need a device-to-room
// mapping that doesn't exist yet on the Device model.
function findOpenForDepartment(departmentId) {
  return prisma.attendanceSession.findFirst({
    where: { departmentId, status: 'OPEN' },
    orderBy: { createdAt: 'desc' },
  });
}

// Sessions are scoped per department, so this is expected to return at most
// a handful of rows. Expiry (session date + end time vs now) is computed in
// the service layer using combineDateAndTime, not pushed into this query.
function findAllOpenForDepartment(departmentId) {
  return prisma.attendanceSession.findMany({ where: { departmentId, status: 'OPEN' } });
}

function closeSession(id, status = 'CLOSED') {
  return prisma.attendanceSession.update({ where: { id }, data: { status } });
}

// Finds whatever session (any status — OPEN, CLOSED, whatever it is *now*)
// covered a given department at a specific past timestamp. Used by offline
// sync, which validates windows retroactively rather than live.
function findSessionCoveringTimestamp(departmentId, sessionDate, timeOfDay) {
  return prisma.attendanceSession.findFirst({
    where: {
      departmentId,
      sessionDate,
      startTime: { lte: timeOfDay },
      endTime: { gte: timeOfDay },
    },
  });
}

function create(data) {
  return prisma.attendanceSession.create({ data });
}

module.exports = {
  findById,
  findOpenForDepartment,
  findAllOpenForDepartment,
  findSessionCoveringTimestamp,
  closeSession,
  create,
};
