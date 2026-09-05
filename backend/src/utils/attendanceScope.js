const WORKER_ROLES = ['OFFICE_STAFF', 'LAB_ASSISTANT', 'SECURITY', 'HOUSEKEEPING', 'MAINTENANCE'];

// Denominator scoping per role — see the module note on why this is a proxy,
// not exact per-subject enrollment (no enrollment table exists in the schema):
// FACULTY -> their own taught sessions; worker roles -> WORKER_SHIFT sessions
// in their department; everyone else (STUDENT, HOD, DEAN, ADMIN) -> all CLASS
// sessions in their department.
function sessionFilterForUser(user, from, to) {
  const dateRange = { sessionDate: { gte: from, lte: to } };
  if (user.role.name === 'FACULTY') {
    return { facultyId: user.id, ...dateRange };
  }
  if (WORKER_ROLES.includes(user.role.name)) {
    return { departmentId: user.departmentId, sessionType: 'WORKER_SHIFT', ...dateRange };
  }
  return { departmentId: user.departmentId, sessionType: 'CLASS', ...dateRange };
}

module.exports = { WORKER_ROLES, sessionFilterForUser };
