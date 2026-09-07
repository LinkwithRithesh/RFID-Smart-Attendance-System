const {
  getEffectiveRole,
  isEffectiveAdmin,
  isEffectiveFaculty,
  isEffectiveStudent,
} = require('../src/utils/roleMapper');

describe('roleMapper', () => {
  test('maps HOD, DEAN, and ADMINISTRATOR to ADMIN', () => {
    expect(getEffectiveRole('HOD')).toBe('ADMIN');
    expect(getEffectiveRole('DEAN')).toBe('ADMIN');
    expect(getEffectiveRole('ADMINISTRATOR')).toBe('ADMIN');
    expect(getEffectiveRole('ADMIN')).toBe('ADMIN');

    expect(isEffectiveAdmin('HOD')).toBe(true);
    expect(isEffectiveAdmin('DEAN')).toBe(true);
    expect(isEffectiveAdmin('ADMINISTRATOR')).toBe(true);
    expect(isEffectiveAdmin('FACULTY')).toBe(false);
  });

  test('maps FACULTY to FACULTY', () => {
    expect(getEffectiveRole('FACULTY')).toBe('FACULTY');
    expect(isEffectiveFaculty('FACULTY')).toBe(true);
    expect(isEffectiveFaculty('STUDENT')).toBe(false);
  });

  test('maps STUDENT to STUDENT', () => {
    expect(getEffectiveRole('STUDENT')).toBe('STUDENT');
    expect(isEffectiveStudent('STUDENT')).toBe(true);
    expect(isEffectiveStudent('ADMINISTRATOR')).toBe(false);
  });

  test('preserves raw string for other operational roles or returns fallback', () => {
    expect(getEffectiveRole('SECURITY')).toBe('SECURITY');
    expect(getEffectiveRole('OFFICE_STAFF')).toBe('OFFICE_STAFF');
    expect(getEffectiveRole('LAB_ASSISTANT')).toBe('LAB_ASSISTANT');
  });

  test('handles null or undefined roles safely', () => {
    expect(getEffectiveRole(null)).toBe('STUDENT');
    expect(getEffectiveRole(undefined)).toBe('STUDENT');
  });
});
