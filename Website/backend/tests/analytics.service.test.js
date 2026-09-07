jest.mock('../src/repositories/user.repository', () => ({
  findById: jest.fn(),
}));
jest.mock('../src/repositories/analytics.repository', () => ({
  countSessions: jest.fn(),
  countAttendedSessions: jest.fn(),
  listUsersInDepartment: jest.fn(),
  listAttendanceRecordsForUser: jest.fn(),
  sessionFilterForUser: jest.requireActual('../src/utils/attendanceScope').sessionFilterForUser,
}));

const { sessionFilterForUser } = require('../src/utils/attendanceScope');
const userRepository = require('../src/repositories/user.repository');
const analyticsRepository = require('../src/repositories/analytics.repository');
const analyticsService = require('../src/services/analytics.service');

const from = new Date('2026-07-01T00:00:00Z');
const to = new Date('2026-07-31T00:00:00Z');

beforeEach(() => jest.clearAllMocks());

describe('sessionFilterForUser (role-scoped denominator)', () => {
  test('FACULTY is scoped to their own taught sessions, not the whole department', () => {
    const faculty = { id: 7, departmentId: 1, role: { name: 'FACULTY' } };
    const filter = sessionFilterForUser(faculty, from, to);
    expect(filter).toEqual({ facultyId: 7, sessionDate: { gte: from, lte: to } });
  });

  test('SECURITY (a worker role) is scoped to WORKER_SHIFT sessions in their department', () => {
    const security = { id: 8, departmentId: 1, role: { name: 'SECURITY' } };
    const filter = sessionFilterForUser(security, from, to);
    expect(filter).toEqual({ departmentId: 1, sessionType: 'WORKER_SHIFT', sessionDate: { gte: from, lte: to } });
  });

  test('STUDENT falls back to department-wide CLASS sessions', () => {
    const student = { id: 9, departmentId: 1, role: { name: 'STUDENT' } };
    const filter = sessionFilterForUser(student, from, to);
    expect(filter).toEqual({ departmentId: 1, sessionType: 'CLASS', sessionDate: { gte: from, lte: to } });
  });
});

describe('computePercentage', () => {
  test('returns null (not 0) when there were no sessions in range at all', () => {
    expect(analyticsService.computePercentage(0, 0)).toBeNull();
  });

  test('computes a rounded percentage to 2 decimal places', () => {
    expect(analyticsService.computePercentage(2, 3)).toBe(66.67);
  });

  test('100% when every session was attended', () => {
    expect(analyticsService.computePercentage(10, 10)).toBe(100);
  });
});

describe('getUserAttendancePercentage', () => {
  test('throws 404 for an unknown user', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(analyticsService.getUserAttendancePercentage(999, from, to)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  test('returns the percentage using the role-scoped denominator', async () => {
    userRepository.findById.mockResolvedValue({
      id: 5, fullName: 'Alice', departmentId: 1, role: { name: 'STUDENT' },
    });
    analyticsRepository.countSessions.mockResolvedValue(20);
    analyticsRepository.countAttendedSessions.mockResolvedValue(15);

    const result = await analyticsService.getUserAttendancePercentage(5, from, to);
    expect(result.percentage).toBe(75);
    expect(result.totalSessions).toBe(20);
    expect(result.attendedSessions).toBe(15);
  });
});

describe('getDepartmentSummary', () => {
  test('computes the department average only from users who had sessions in range', async () => {
    analyticsRepository.listUsersInDepartment.mockResolvedValue([
      { id: 1, fullName: 'A', departmentId: 1, role: { name: 'STUDENT' } },
      { id: 2, fullName: 'B', departmentId: 1, role: { name: 'STUDENT' } },
      { id: 3, fullName: 'C', departmentId: 1, role: { name: 'STUDENT' } }, // no sessions -> excluded from average
    ]);
    analyticsRepository.countSessions
      .mockResolvedValueOnce(10) // user 1
      .mockResolvedValueOnce(10) // user 2
      .mockResolvedValueOnce(0); // user 3 — no sessions at all
    analyticsRepository.countAttendedSessions
      .mockResolvedValueOnce(8) // user 1: 80%
      .mockResolvedValueOnce(6) // user 2: 60%
      .mockResolvedValueOnce(0);

    const result = await analyticsService.getDepartmentSummary(1, from, to);

    expect(result.users).toHaveLength(3);
    expect(result.users[2].percentage).toBeNull();
    expect(result.departmentAveragePercentage).toBe(70); // avg of 80 and 60, user 3 excluded
  });
});

describe('getLowAttendance', () => {
  test('filters to users strictly below the threshold, excluding users with no sessions at all', async () => {
    analyticsRepository.listUsersInDepartment.mockResolvedValue([
      { id: 1, fullName: 'A', departmentId: 1, role: { name: 'STUDENT' } },
      { id: 2, fullName: 'B', departmentId: 1, role: { name: 'STUDENT' } },
      { id: 3, fullName: 'C', departmentId: 1, role: { name: 'STUDENT' } },
    ]);
    analyticsRepository.countSessions
      .mockResolvedValueOnce(10) // user 1: has sessions
      .mockResolvedValueOnce(10) // user 2: has sessions
      .mockResolvedValueOnce(0); // user 3: no sessions at all
    analyticsRepository.countAttendedSessions
      .mockResolvedValueOnce(5) // user 1: 50% -> below 75
      .mockResolvedValueOnce(8) // user 2: 80% -> above 75
      .mockResolvedValueOnce(0);

    const result = await analyticsService.getLowAttendance(1, from, to, undefined, 75);

    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe(1);
  });
});
