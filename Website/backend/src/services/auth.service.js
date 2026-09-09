const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const userRepository = require('../repositories/user.repository');
const auditLogRepository = require('../repositories/auditLog.repository');
const otpService = require('./otp.service');
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

async function checkDuplicates(payload) {
  // 1. Email check
  const existingEmail = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existingEmail) {
    throw new ApiError(409, 'Email already registered.');
  }

  // 2. RFID check (if provided and non-empty)
  if (payload.rfidCardId && String(payload.rfidCardId).trim()) {
    const rfidVal = String(payload.rfidCardId).trim();
    const existingRfid = await prisma.user.findUnique({ where: { rfidCardId: rfidVal } });
    if (existingRfid) {
      throw new ApiError(409, 'RFID tag already registered.');
    }
  }

  // 3. Roll number / Employee ID check
  const roleUpper = (payload.role || 'STUDENT').toUpperCase();
  const regId = payload.rollNumber || payload.employeeId || payload.registrationId;

  if (roleUpper === 'STUDENT') {
    if (!regId) throw new ApiError(400, 'Roll number is required.');
    const existingRoll = await prisma.studentProfile.findUnique({ where: { rollNumber: String(regId).trim() } });
    if (existingRoll) {
      throw new ApiError(409, 'Registration number already registered.');
    }
  } else if (roleUpper === 'FACULTY') {
    if (!regId) throw new ApiError(400, 'Employee ID is required.');
    const existingEmp = await prisma.facultyProfile.findUnique({ where: { employeeId: String(regId).trim() } });
    if (existingEmp) {
      throw new ApiError(409, 'Employee ID already registered.');
    }
  }
}

async function register(payload) {
  await checkDuplicates(payload);
  const otp = await otpService.generateAndStoreOtp(payload.email, payload);
  return { otp, email: payload.email };
}

async function verifyRegisterOtp(email, inputOtp) {
  const payload = await otpService.verifyOtp(email, inputOtp);
  
  // Re-verify duplicates before DB write
  await checkDuplicates(payload);

  const PASSWORD_SALT_ROUNDS = 10;
  const passwordHash = await bcrypt.hash(payload.password, PASSWORD_SALT_ROUNDS);

  const roleUpper = (payload.role || 'STUDENT').toUpperCase();
  const roleRow = await prisma.role.findUnique({ where: { name: roleUpper } });
  if (!roleRow) {
    throw new ApiError(400, 'Invalid role specified.');
  }

  let profileRelation;
  let profileData;
  let regId;

  if (roleUpper === 'STUDENT') {
    regId = String(payload.rollNumber || payload.registrationId).trim();
    profileRelation = 'studentProfile';
    profileData = {
      rollNumber: regId,
      courseId: Number(payload.courseId || 1),
      currentSemester: Number(payload.currentSemester || 1),
      admissionYear: Number(payload.admissionYear || new Date().getFullYear()),
    };
  } else {
    regId = String(payload.employeeId || payload.registrationId).trim();
    profileRelation = 'facultyProfile';
    profileData = {
      employeeId: regId,
      designation: payload.designation || 'Faculty Member',
    };
  }

  const rfidVal = (payload.rfidCardId && String(payload.rfidCardId).trim()) ? String(payload.rfidCardId).trim() : null;

  const user = await prisma.user.create({
    data: {
      fullName: payload.fullName,
      email: payload.email,
      passwordHash,
      roleId: roleRow.id,
      departmentId: payload.departmentId ? Number(payload.departmentId) : null,
      phone: payload.mobile || payload.phone || null,
      rfidCardId: rfidVal,
      status: 'PENDING',
      isActive: true,
      [profileRelation]: { create: profileData },
    },
  });

  return {
    id: user.id,
    registrationId: regId,
    status: user.status,
  };
}

async function login(emailOrId, password, ipAddress) {
  const user = await userRepository.findByEmailOrIdentifier(emailOrId);
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Status gating per spec
  if (user.status === 'PENDING') {
    throw new ApiError(403, 'Your registration is awaiting administrator approval.');
  }
  if (user.status === 'REJECTED') {
    throw new ApiError(403, 'Your registration was rejected. Please contact the administrator.');
  }
  if (user.status === 'DISABLED' || !user.isActive) {
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
  if (!user || !user.isActive || user.status !== 'APPROVED' || !user.refreshTokenHash) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const tokenMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!tokenMatches) {
    await userRepository.updateRefreshTokenHash(user.id, null);
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  return issueTokens(user);
}

async function changePassword(userId, oldPassword, newPassword, ipAddress) {
  const user = await userRepository.findById(userId);
  if (!user || !user.isActive) {
    throw new ApiError(404, 'User not found');
  }

  const matches = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!matches) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  const PASSWORD_SALT_ROUNDS = 10;
  const newHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  await auditLogRepository.log({
    actorId: userId,
    action: 'PASSWORD_CHANGED',
    entityType: 'User',
    entityId: userId,
    ipAddress,
  });

  return true;
}

async function logout(userId) {
  if (userId) {
    await userRepository.updateRefreshTokenHash(userId, null);
  }
}

module.exports = {
  register,
  verifyRegisterOtp,
  login,
  refresh,
  logout,
  changePassword,
};
