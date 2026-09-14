process.env.JWT_ACCESS_SECRET = 'test_access_secret';

jest.mock('../src/services/user.service', () => ({
  createUser: jest.fn(),
  listUsers: jest.fn(),
  getUser: jest.fn(),
  updateUser: jest.fn(),
  deactivateUser: jest.fn(),
}));

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const userService = require('../src/services/user.service');
const userRoutes = require('../src/routes/user.routes');
const ApiError = require('../src/utils/ApiError');
const { errorHandler } = require('../src/middleware/errorHandler');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/users', userRoutes);
  app.use(errorHandler);
  return app;
}

function tokenFor(id, role) {
  return jwt.sign({ sub: id, roleId: 1, role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

describe('user routes: GET /:id self-or-admin access', () => {
  const app = buildApp();
  beforeEach(() => jest.clearAllMocks());

  test('a STUDENT can fetch their own profile', async () => {
    userService.getUser.mockResolvedValue({ id: 5, fullName: 'Alice' });
    const res = await request(app).get('/users/5').set('Authorization', `Bearer ${tokenFor(5, 'STUDENT')}`);
    expect(res.status).toBe(200);
    expect(userService.getUser).toHaveBeenCalledWith(5, expect.objectContaining({ id: 5, role: 'STUDENT' }));
  });

  test('the service enforces self-or-admin — a non-admin fetching someone else gets 403 from the service layer', async () => {
    userService.getUser.mockRejectedValue(new ApiError(403, 'forbidden'));
    const res = await request(app).get('/users/7').set('Authorization', `Bearer ${tokenFor(5, 'STUDENT')}`);
    expect(res.status).toBe(403);
  });

  test('an ADMINISTRATOR can fetch any user via the route', async () => {
    userService.getUser.mockResolvedValue({ id: 7, fullName: 'Bob' });
    const res = await request(app).get('/users/7').set('Authorization', `Bearer ${tokenFor(1, 'ADMINISTRATOR')}`);
    expect(res.status).toBe(200);
  });
});

describe('user routes: list/create remain ADMINISTRATOR-only', () => {
  const app = buildApp();
  beforeEach(() => jest.clearAllMocks());

  test('a STUDENT cannot list users', async () => {
    const res = await request(app).get('/users').set('Authorization', `Bearer ${tokenFor(5, 'STUDENT')}`);
    expect(res.status).toBe(403);
    expect(userService.listUsers).not.toHaveBeenCalled();
  });

  test('an ADMINISTRATOR can list users', async () => {
    userService.listUsers.mockResolvedValue({ users: [], pagination: {} });
    const res = await request(app).get('/users').set('Authorization', `Bearer ${tokenFor(1, 'ADMINISTRATOR')}`);
    expect(res.status).toBe(200);
  });
});
