/**
 * SmartAttend Role Mapper
 * Maps fine-grained university backend roles down to the 3 canonical frontend roles:
 * - STUDENT
 * - FACULTY
 * - ADMIN (HOD, DEAN, ADMINISTRATOR)
 *
 * Other backend roles (SECURITY, OFFICE_STAFF, LAB_ASSISTANT, etc.) are preserved
 * in their raw form for backend logging while resolving to a safe effective category.
 */

function getEffectiveRole(rawRole) {
  if (!rawRole) return 'STUDENT';
  const upper = String(rawRole).toUpperCase();

  switch (upper) {
    case 'STUDENT':
      return 'STUDENT';
    case 'FACULTY':
      return 'FACULTY';
    case 'HOD':
    case 'DEAN':
    case 'ADMINISTRATOR':
    case 'ADMIN':
      return 'ADMIN';
    default:
      return upper;
  }
}

function isEffectiveAdmin(rawRole) {
  return getEffectiveRole(rawRole) === 'ADMIN';
}

function isEffectiveFaculty(rawRole) {
  return getEffectiveRole(rawRole) === 'FACULTY';
}

function isEffectiveStudent(rawRole) {
  return getEffectiveRole(rawRole) === 'STUDENT';
}

module.exports = {
  getEffectiveRole,
  isEffectiveAdmin,
  isEffectiveFaculty,
  isEffectiveStudent,
};
