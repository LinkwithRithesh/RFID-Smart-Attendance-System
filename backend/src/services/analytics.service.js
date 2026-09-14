const ApiError = require('../utils/ApiError');
const userRepository = require('../repositories/user.repository');
const analyticsRepository = require('../repositories/analytics.repository');

const DEFAULT_LOW_ATTENDANCE_THRESHOLD = 75;

function computePercentage(attended, total) {
  if (total === 0) return null; // no sessions in range — undefined, not 0%
  return Math.round((attended / total) * 10000) / 100; // 2 decimal places
}

async function getUserAttendancePercentage(userId, from, to) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const sessionFilter = analyticsRepository.sessionFilterForUser(user, from, to);
  const [total, attended] = await Promise.all([
    analyticsRepository.countSessions(sessionFilter),
    analyticsRepository.countAttendedSessions(userId, sessionFilter),
  ]);

  return {
    userId: user.id,
    fullName: user.fullName,
    role: user.role.name,
    totalSessions: total,
    attendedSessions: attended,
    percentage: computePercentage(attended, total),
  };
}

async function getDepartmentSummary(departmentId, from, to, roleName) {
  const users = await analyticsRepository.listUsersInDepartment(departmentId, roleName);

  // Known scaling limitation: this fires 2 queries per user concurrently
  // (Promise.all across users, not sequential) rather than 1-2 batched
  // queries for the whole department. It's index-covered (idx_users_dept_active,
  // idx_sessions_dept_*, idx_attendance_user_status) so each individual query
  // is fast, but for a very large department (hundreds of users) this is
  // still hundreds of round trips fired at once, which could pressure the
  // connection pool. A full batch/groupBy rewrite is possible but non-trivial
  // here because the denominator's scoping differs per role (FACULTY uses
  // facultyId, worker roles use WORKER_SHIFT sessions, everyone else uses
  // department-wide CLASS sessions — see attendanceScope.js) — batching would
  // need to correctly group by that per-role filter. Left as a documented
  // follow-up rather than a risky rewrite of already-tested logic.
  const userStats = await Promise.all(
    users.map(async (user) => {
      const sessionFilter = analyticsRepository.sessionFilterForUser(user, from, to);
      const [total, attended] = await Promise.all([
        analyticsRepository.countSessions(sessionFilter),
        analyticsRepository.countAttendedSessions(user.id, sessionFilter),
      ]);
      return {
        userId: user.id,
        fullName: user.fullName,
        role: user.role.name,
        totalSessions: total,
        attendedSessions: attended,
        percentage: computePercentage(attended, total),
      };
    })
  );

  const withData = userStats.filter((u) => u.percentage !== null);
  const departmentAverage =
    withData.length > 0
      ? Math.round((withData.reduce((sum, u) => sum + u.percentage, 0) / withData.length) * 100) / 100
      : null;

  return { departmentId, from, to, departmentAveragePercentage: departmentAverage, users: userStats };
}

async function getLowAttendance(departmentId, from, to, roleName, threshold = DEFAULT_LOW_ATTENDANCE_THRESHOLD) {
  const summary = await getDepartmentSummary(departmentId, from, to, roleName);
  return summary.users.filter((u) => u.percentage !== null && u.percentage < threshold);
}

module.exports = { computePercentage, getUserAttendancePercentage, getDepartmentSummary, getLowAttendance };
