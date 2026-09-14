// Maps each fixed role name to the Prisma relation key used to create its
// profile row in the same transaction as the user. Single source of truth
// shared by user.validation.js and user.repository.js.
const ROLE_PROFILE_RELATION = {
  STUDENT: 'studentProfile',
  FACULTY: 'facultyProfile',
  HOD: 'hodProfile',
  DEAN: 'deanProfile',
  ADMINISTRATOR: 'administratorProfile',
  OFFICE_STAFF: 'officeStaffProfile',
  LAB_ASSISTANT: 'labAssistantProfile',
  SECURITY: 'securityProfile',
  HOUSEKEEPING: 'housekeepingProfile',
  MAINTENANCE: 'maintenanceProfile',
};

module.exports = { ROLE_PROFILE_RELATION };
