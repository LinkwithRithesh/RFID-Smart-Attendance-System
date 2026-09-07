const bcrypt = require('bcrypt');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const userRepository = require('../repositories/user.repository');
const auditLogRepository = require('../repositories/auditLog.repository');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt.utils');

const REFRESH_TOKEN_SALT_ROUNDS = 10;

const { getEffectiveRole } = require('../utils/roleMapper');

function buildTokenPayload(user) {
  const role = user.role.name;
  return { sub: user.id, roleId: user.roleId, role, effectiveRole: getEffectiveRole(role) };
}

function toPublicUser(user) {
  const role = user.role.name;
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role,
    effectiveRole: getEffectiveRole(role),
  };
}

async function issueTokens(user) {
  const payload = buildTokenPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: user.id, jti: crypto.randomUUID() });

  const refreshTokenHash = await bcrypt.hash(refreshToken, REFRESH_TOKEN_SALT_ROUNDS);
  await userRepository.updateRefreshTokenHash(user.id, refreshTokenHash);

  return { accessToken, refreshToken };
}

async function login(email, password, ipAddress) {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const tokens = await issueTokens(user);
  await auditLogRepository.log({
    actorId: user.id,
    action: 'LOGIN',
    entityType: 'User',
    entityId: user.id,
    ipAddress,
  });

  return { ...tokens, user: toPublicUser(user) };
}

async function refresh(refreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await userRepository.findById(decoded.sub);
  if (!user || !user.isActive || !user.refreshTokenHash) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const tokenMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!tokenMatches) {
    // Token doesn't match the one on record — possible reuse of a rotated
    // token. Invalidate the stored hash so this identity chain is dead.
    await userRepository.updateRefreshTokenHash(user.id, null);
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  return issueTokens(user); // rotate: issue new pair, overwrite stored hash
}

async function logout(userId) {
  await userRepository.updateRefreshTokenHash(userId, null);
}

module.exports = { login, refresh, logout };
