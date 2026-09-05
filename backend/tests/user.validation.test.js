const { createUserSchema, listUsersQuerySchema } = require('../src/validations/user.validation');

describe('createUserSchema', () => {
  test('accepts a valid STUDENT payload', () => {
    const result = createUserSchema.safeParse({
      body: {
        fullName: 'Alice Student',
        email: 'alice@campus.edu',
        password: 'password123',
        role: 'STUDENT',
        profile: { rollNumber: 'CSE2025001', courseId: 1, currentSemester: 3, admissionYear: 2023 },
      },
    });
    expect(result.success).toBe(true);
  });

  test('rejects STUDENT payload missing required profile fields', () => {
    const result = createUserSchema.safeParse({
      body: {
        fullName: 'Alice Student',
        email: 'alice@campus.edu',
        password: 'password123',
        role: 'STUDENT',
        profile: { rollNumber: 'CSE2025001' }, // missing courseId/currentSemester/admissionYear
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects a SECURITY payload using the STUDENT profile shape', () => {
    const result = createUserSchema.safeParse({
      body: {
        fullName: 'Sam Guard',
        email: 'sam@campus.edu',
        password: 'password123',
        role: 'SECURITY',
        profile: { rollNumber: 'CSE2025001', courseId: 1, currentSemester: 3, admissionYear: 2023 },
      },
    });
    expect(result.success).toBe(false);
  });

  test('accepts a valid SECURITY payload with only its own optional fields', () => {
    const result = createUserSchema.safeParse({
      body: {
        fullName: 'Sam Guard',
        email: 'sam@campus.edu',
        password: 'password123',
        role: 'SECURITY',
        profile: { employeeId: 'SEC001' },
      },
    });
    expect(result.success).toBe(true);
  });

  test('rejects an unknown role literal', () => {
    const result = createUserSchema.safeParse({
      body: {
        fullName: 'Nobody',
        email: 'nobody@campus.edu',
        password: 'password123',
        role: 'SUPERVISOR',
        profile: {},
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects a password shorter than 8 characters', () => {
    const result = createUserSchema.safeParse({
      body: {
        fullName: 'Alice Student',
        email: 'alice@campus.edu',
        password: 'short',
        role: 'STUDENT',
        profile: { rollNumber: 'CSE2025001', courseId: 1, currentSemester: 3, admissionYear: 2023 },
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('listUsersQuerySchema', () => {
  test('applies defaults for page and limit when omitted', () => {
    const result = listUsersQuerySchema.safeParse({ query: {} });
    expect(result.success).toBe(true);
    expect(result.data.query.page).toBe(1);
    expect(result.data.query.limit).toBe(20);
  });

  test('coerces string query params to numbers/booleans', () => {
    const result = listUsersQuerySchema.safeParse({
      query: { page: '2', limit: '10', departmentId: '3', isActive: 'true' },
    });
    expect(result.success).toBe(true);
    expect(result.data.query).toEqual({ page: 2, limit: 10, departmentId: 3, isActive: true });
  });

  test('rejects a limit above the max of 100', () => {
    const result = listUsersQuerySchema.safeParse({ query: { limit: '500' } });
    expect(result.success).toBe(false);
  });
});
