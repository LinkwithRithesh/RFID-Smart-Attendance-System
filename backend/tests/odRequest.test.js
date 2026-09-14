process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const prisma = require('../src/config/database');
const notificationService = require('../src/services/notification.service');

jest.mock('../src/config/database', () => ({
  leaveRequest: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../src/services/notification.service', () => ({
  notifyUser: jest.fn().mockResolvedValue([]),
}));

const jwtConfig = require('../src/config/jwt');

function makeAuthHeader(user) {
  const token = jwt.sign(
    { sub: user.id, id: user.id, email: user.email, role: user.role, effectiveRole: user.effectiveRole || user.role },
    jwtConfig.accessSecret,
    { expiresIn: '1h' }
  );
  return `Bearer ${token}`;
}

describe('OD Request Role-Gated Lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('FACULTY role can transition status to FACULTY_APPROVED', async () => {
    const facultyUser = { id: 10, email: 'faculty@campus.edu', role: 'FACULTY', effectiveRole: 'FACULTY' };
    const authHeader = makeAuthHeader(facultyUser);

    prisma.leaveRequest.findUnique.mockResolvedValue({
      id: 5,
      userId: 2,
      status: 'PENDING',
    });
    prisma.leaveRequest.update.mockResolvedValue({
      id: 5,
      status: 'APPROVED', // database enum maps to APPROVED
    });

    const res = await request(app)
      .patch('/api/v1/od-requests/OD-5/status')
      .set('Authorization', authHeader)
      .send({ status: 'FACULTY_APPROVED', reason: 'Verified workshop participation' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('FACULTY_APPROVED');
    expect(notificationService.notifyUser).toHaveBeenCalledWith(
      2,
      'GENERAL',
      'OD Request FACULTY APPROVED',
      expect.stringContaining('Verified workshop participation')
    );
  });

  test('STUDENT cannot transition status to FACULTY_APPROVED (403 Forbidden)', async () => {
    const studentUser = { id: 2, email: 'student@campus.edu', role: 'STUDENT', effectiveRole: 'STUDENT' };
    const authHeader = makeAuthHeader(studentUser);

    const res = await request(app)
      .patch('/api/v1/od-requests/OD-5/status')
      .set('Authorization', authHeader)
      .send({ status: 'FACULTY_APPROVED' });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Only Faculty members');
  });

  test('ADMIN can transition status to APPROVED', async () => {
    const adminUser = { id: 1, email: 'admin@campus.edu', role: 'ADMINISTRATOR', effectiveRole: 'ADMIN' };
    const authHeader = makeAuthHeader(adminUser);

    prisma.leaveRequest.findUnique.mockResolvedValue({
      id: 5,
      userId: 2,
      status: 'APPROVED',
    });
    prisma.leaveRequest.update.mockResolvedValue({
      id: 5,
      status: 'APPROVED',
    });

    const res = await request(app)
      .patch('/api/v1/od-requests/OD-5/status')
      .set('Authorization', authHeader)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');
    expect(notificationService.notifyUser).toHaveBeenCalledWith(
      2,
      'GENERAL',
      'OD Request APPROVED',
      expect.any(String)
    );
  });

  test('FACULTY cannot transition status to final APPROVED (403 Forbidden)', async () => {
    const facultyUser = { id: 10, email: 'faculty@campus.edu', role: 'FACULTY', effectiveRole: 'FACULTY' };
    const authHeader = makeAuthHeader(facultyUser);

    const res = await request(app)
      .patch('/api/v1/od-requests/OD-5/status')
      .set('Authorization', authHeader)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Only Administrators/HOD');
  });
});
