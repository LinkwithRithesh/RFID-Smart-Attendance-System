const prisma = require('../config/database');
const { WORKER_ROLES, sessionFilterForUser } = require('../utils/attendanceScope');

function countSessions(filter) {
  return prisma.attendanceSession.count({ where: filter });
}

function countAttendedSessions(userId, sessionFilter) {
  return prisma.attendance.count({
    where: { userId, status: { in: ['PRESENT', 'LATE'] }, session: sessionFilter },
  });
}

function listUsersInDepartment(departmentId, roleName) {
  return prisma.user.findMany({
    where: {
      departmentId,
      isActive: true,
      ...(roleName && { role: { name: roleName } }),
    },
    include: { role: true },
  });
}

function listAttendanceRecordsForUser(userId, sessionFilter) {
  return prisma.attendance.findMany({
    where: { userId, session: sessionFilter },
    include: { session: true },
    orderBy: { markedAt: 'asc' },
  });
}

module.exports = {
  WORKER_ROLES,
  sessionFilterForUser,
  countSessions,
  countAttendedSessions,
  listUsersInDepartment,
  listAttendanceRecordsForUser,
};
