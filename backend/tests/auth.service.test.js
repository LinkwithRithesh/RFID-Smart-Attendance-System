// Must be set before requiring auth.service, since src/config/jwt.js reads
// these env vars at module-load time, not lazily.
process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

const bcrypt = require('bcrypt');

// Explicit factories (not automock): the real repository files import
// src/config/database.js, which instantiates PrismaClient at load time and
// throws unless `prisma generate` has been run. Factories skip loading the
// real chain entirely so these tests don't depend on a generated client.
jest.mock('../src/repositories/user.repository', () => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  updateRefreshTokenHash: jest.fn(),
}));
jest.mock('../src/repositories/auditLog.repository', () => ({
  log: jest.fn(),
}));

const userRepository = require('../src/repositories/user.repository');
const auditLogRepository = require('../src/repositories/auditLog.repository');
const authService = require('../src/services/auth.service');

const mockRole = { id: 2, name: 'FACULTY' };

function makeUser(overrides = {}) {
  return {
    id: 1,
    fullName: 'Dr. Rao',
    email: 'rao@campus.edu',
    isActive: true,
    roleId: 2,
    role: mockRole,
    refreshTokenHash: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  auditLogRepository.log.mockResolvedValue({});
});

describe('auth.service login', () => {
  test('succeeds with correct credentials and returns tokens + public user', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 10);
    const user = makeUser({ passwordHash });
    userRepository.findByEmail.mockResolvedValue(user);
    userRepository.updateRefreshTokenHash.mockResolvedValue({});

    const result = await authService.login('rao@campus.edu', 'correct-password', '127.0.0.1');

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.user).toEqual({ id: 1, fullName: 'Dr. Rao', email: 'rao@campus.edu', role: 'FACULTY', effectiveRole: 'FACULTY' });
    expect(userRepository.updateRefreshTokenHash).toHaveBeenCalledWith(1, expect.any(String));
    expect(auditLogRepository.log).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 1, action: 'LOGIN' })
    );
  });

  test('rejects wrong password without leaking which field was wrong', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 10);
    userRepository.findByEmail.mockResolvedValue(makeUser({ passwordHash }));

    await expect(authService.login('rao@campus.edu', 'wrong-password')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    });
  });

  test('rejects unknown email', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(authService.login('nobody@campus.edu', 'anything')).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  test('rejects deactivated user even with correct password', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 10);
    userRepository.findByEmail.mockResolvedValue(makeUser({ passwordHash, isActive: false }));

    await expect(authService.login('rao@campus.edu', 'correct-password')).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});

describe('auth.service refresh', () => {
  test('rotates tokens when the refresh token matches the stored hash', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 10);
    const user = makeUser({ passwordHash });
    userRepository.findByEmail.mockResolvedValue(user);
    userRepository.updateRefreshTokenHash.mockImplementation(async (id, hash) => {
      user.refreshTokenHash = hash;
      return user;
    });

    const { refreshToken } = await authService.login('rao@campus.edu', 'correct-password');
    userRepository.findById.mockResolvedValue(user);

    const rotated = await authService.refresh(refreshToken);

    expect(rotated.accessToken).toEqual(expect.any(String));
    expect(rotated.refreshToken).toEqual(expect.any(String));
    expect(rotated.refreshToken).not.toEqual(refreshToken);
  });

  test('rejects and invalidates the session when a stale/reused refresh token is presented', async () => {
    const staleHash = await bcrypt.hash('some-other-token', 10);
    const user = makeUser({ refreshTokenHash: staleHash });
    userRepository.findById.mockResolvedValue(user);
    userRepository.updateRefreshTokenHash.mockResolvedValue({});

    const jwt = require('jsonwebtoken');
    const forgedToken = jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    await expect(authService.refresh(forgedToken)).rejects.toMatchObject({ statusCode: 401 });
    expect(userRepository.updateRefreshTokenHash).toHaveBeenCalledWith(user.id, null);
  });

  test('rejects a garbage/invalid token', async () => {
    await expect(authService.refresh('not-a-real-jwt')).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('auth.service logout', () => {
  test('clears the stored refresh token hash', async () => {
    userRepository.updateRefreshTokenHash.mockResolvedValue({});
    await authService.logout(1);
    expect(userRepository.updateRefreshTokenHash).toHaveBeenCalledWith(1, null);
  });
});
