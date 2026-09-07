jest.mock('../src/repositories/user.repository', () => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findByIdWithProfile: jest.fn(),
  createUserWithProfile: jest.fn(),
  listUsers: jest.fn(),
  updateUser: jest.fn(),
  deactivateUser: jest.fn(),
}));
jest.mock('../src/repositories/role.repository', () => ({
  findByName: jest.fn(),
  findById: jest.fn(),
}));
jest.mock('../src/repositories/auditLog.repository', () => ({
  log: jest.fn(),
}));

const userRepository = require('../src/repositories/user.repository');
const roleRepository = require('../src/repositories/role.repository');
const auditLogRepository = require('../src/repositories/auditLog.repository');
const userService = require('../src/services/user.service');

const studentRole = { id: 1, name: 'STUDENT' };

function makeUser(overrides = {}) {
  return {
    id: 5,
    fullName: 'Alice Student',
    email: 'alice@campus.edu',
    isActive: true,
    departmentId: 1,
    role: studentRole,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  auditLogRepository.log.mockResolvedValue({});
});

describe('createUser', () => {
  const payload = {
    role: 'STUDENT',
    fullName: 'Alice Student',
    email: 'alice@campus.edu',
    password: 'password123',
    profile: { rollNumber: 'CSE2025001', courseId: 1, currentSemester: 3, admissionYear: 2023 },
  };

  test('creates a user with the correct profile relation and hashes the password', async () => {
    roleRepository.findByName.mockResolvedValue(studentRole);
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.createUserWithProfile.mockResolvedValue(makeUser());

    const result = await userService.createUser(payload, 99);

    expect(userRepository.createUserWithProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        profileRelation: 'studentProfile',
        profileData: payload.profile,
        roleId: 1,
        passwordHash: expect.any(String),
      })
    );
    // password must be hashed, never stored/passed as plaintext
    expect(userRepository.createUserWithProfile.mock.calls[0][0].passwordHash).not.toBe('password123');
    expect(result).toEqual({
      id: 5, fullName: 'Alice Student', email: 'alice@campus.edu', role: 'STUDENT', departmentId: 1, isActive: true,
    });
    expect(auditLogRepository.log).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 99, action: 'USER_CREATED', entityId: 5 })
    );
  });

  test('rejects an unknown role even if it slipped past validation', async () => {
    roleRepository.findByName.mockResolvedValue(null);
    await expect(userService.createUser({ ...payload, role: 'BOGUS' }, 99)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(userRepository.createUserWithProfile).not.toHaveBeenCalled();
  });

  test('rejects a duplicate email', async () => {
    roleRepository.findByName.mockResolvedValue(studentRole);
    userRepository.findByEmail.mockResolvedValue(makeUser());

    await expect(userService.createUser(payload, 99)).rejects.toMatchObject({ statusCode: 409 });
    expect(userRepository.createUserWithProfile).not.toHaveBeenCalled();
  });
});

describe('getUser', () => {
  const admin = { id: 99, role: 'ADMINISTRATOR' };

  test('throws 404 when the user does not exist', async () => {
    userRepository.findByIdWithProfile.mockResolvedValue(null);
    await expect(userService.getUser(999, admin)).rejects.toMatchObject({ statusCode: 404 });
  });

  test('returns the user with its role-specific profile and department name attached', async () => {
    userRepository.findByIdWithProfile.mockResolvedValue({
      ...makeUser(),
      department: { id: 1, name: 'Computer Science' },
      studentProfile: { rollNumber: 'CSE2025001' },
    });
    const result = await userService.getUser(5, admin);
    expect(result.profile).toEqual({ rollNumber: 'CSE2025001' });
    expect(result.departmentName).toBe('Computer Science');
  });

  test('an ADMINISTRATOR can view any user', async () => {
    userRepository.findByIdWithProfile.mockResolvedValue(makeUser());
    await expect(userService.getUser(5, admin)).resolves.toBeTruthy();
  });

  test('a user can view their own profile', async () => {
    userRepository.findByIdWithProfile.mockResolvedValue(makeUser());
    const self = { id: 5, role: 'STUDENT' };
    await expect(userService.getUser(5, self)).resolves.toBeTruthy();
  });

  test('a non-admin cannot view someone else\'s profile', async () => {
    const other = { id: 7, role: 'STUDENT' };
    await expect(userService.getUser(5, other)).rejects.toMatchObject({ statusCode: 403 });
    expect(userRepository.findByIdWithProfile).not.toHaveBeenCalled();
  });
});

describe('updateUser', () => {
  test('throws 404 when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(userService.updateUser(999, { fullName: 'X' }, 1)).rejects.toMatchObject({ statusCode: 404 });
  });

  test('updates and logs an audit entry', async () => {
    userRepository.findById.mockResolvedValue(makeUser());
    userRepository.updateUser.mockResolvedValue(makeUser({ fullName: 'Alice Updated' }));

    const result = await userService.updateUser(5, { fullName: 'Alice Updated' }, 1);

    expect(result.fullName).toBe('Alice Updated');
    expect(auditLogRepository.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_UPDATED', entityId: 5 })
    );
  });
});

describe('deactivateUser', () => {
  test('throws 404 when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(userService.deactivateUser(999, 1)).rejects.toMatchObject({ statusCode: 404 });
  });

  test('throws 409 when the user is already deactivated', async () => {
    userRepository.findById.mockResolvedValue(makeUser({ isActive: false }));
    await expect(userService.deactivateUser(5, 1)).rejects.toMatchObject({ statusCode: 409 });
  });

  test('deactivates an active user and logs the action', async () => {
    userRepository.findById.mockResolvedValue(makeUser({ isActive: true }));
    userRepository.deactivateUser.mockResolvedValue({});

    await userService.deactivateUser(5, 1);

    expect(userRepository.deactivateUser).toHaveBeenCalledWith(5);
    expect(auditLogRepository.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_DEACTIVATED', entityId: 5 })
    );
  });
});
