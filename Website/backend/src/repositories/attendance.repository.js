const prisma = require('../config/database');

function findAttendance(sessionId, userId) {
  return prisma.attendance.findUnique({
    where: { uq_session_user: { sessionId, userId } },
  });
}

function createAttendance(data) {
  return prisma.attendance.create({ data });
}

function listBySession(sessionId) {
  return prisma.attendance.findMany({
    where: { sessionId },
    include: { user: { select: { id: true, fullName: true, email: true } } },
    orderBy: { markedAt: 'asc' },
  });
}

module.exports = {
  findAttendance,
  createAttendance,
  listBySession,
};
