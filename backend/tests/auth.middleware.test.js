process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const authenticate = require('../src/middleware/authenticate');
const authorize = require('../src/middleware/authorize');
const { errorHandler } = require('../src/middleware/errorHandler');

function buildApp() {
  const app = express();
  app.get('/protected', authenticate, (req, res) => res.json({ user: req.user }));
  app.get(
    '/dean-only',
    authenticate,
    authorize('DEAN', 'ADMINISTRATOR'),
    (req, res) => res.json({ ok: true })
  );
  app.use(errorHandler);
  return app;
}

function tokenFor(role, overrides = {}) {
  return jwt.sign(
    { sub: 1, roleId: 1, role, ...overrides },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

describe('authenticate middleware', () => {
  const app = buildApp();

  test('rejects requests with no Authorization header', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
  });

  test('rejects a malformed Authorization header', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Token abc');
    expect(res.status).toBe(401);
  });

  test('rejects an invalid/tampered token', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Bearer not-a-real-jwt');
    expect(res.status).toBe(401);
  });

  test('rejects an expired token', async () => {
    const expired = jwt.sign({ sub: 1, roleId: 1, role: 'FACULTY' }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: '-10s',
    });
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  test('accepts a valid token and attaches req.user', async () => {
    const token = tokenFor('FACULTY');
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: 1, roleId: 1, role: 'FACULTY' });
  });
});

describe('authorize middleware (RBAC)', () => {
  const app = buildApp();

  test('allows a role in the allow-list', async () => {
    const res = await request(app).get('/dean-only').set('Authorization', `Bearer ${tokenFor('DEAN')}`);
    expect(res.status).toBe(200);
  });

  test('blocks a role not in the allow-list', async () => {
    const res = await request(app).get('/dean-only').set('Authorization', `Bearer ${tokenFor('STUDENT')}`);
    expect(res.status).toBe(403);
  });

  test('blocks when no token is present at all', async () => {
    const res = await request(app).get('/dean-only');
    expect(res.status).toBe(401);
  });
});
