const bcrypt = require('bcrypt');
const ApiError = require('../utils/ApiError');
const userRepository = require('../repositories/user.repository');
const roleRepository = require('../repositories/role.repository');
const auditLogRepository = require('../repositories/auditLog.repository');
const { ROLE_PROFILE_RELATION } = require('../utils/roleProfileMap');

const PASSWORD_SALT_ROUNDS = 10;

function toPublicUser(user) {
  const obj = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role?.name || user.role,
    departmentId: user.departmentId,
    isActive: user.isActive,
  };
  if (user.phone !== undefined) {
    obj.phone = user.phone;
  }
  return obj;
}

function toPublicUserWithProfile(user) {
  const roleName = user.role?.name || user.role;
  const profileRelation = ROLE_PROFILE_RELATION[roleName];
  return {
    ...toPublicUser(user),
    departmentName: user.department?.name || null,
    profile: user[profileRelation] || null,
    rfidCardId: user.rfidCardId || null,
    hasFaceEmbedding: !!user.faceEmbeddingPath,
    faceImagePath: user.faceEmbeddingPath ? `http://localhost:5000/${user.faceEmbeddingPath}` : null,
  };
}

async function createUser({ role: roleName, profile, password, ...userFields }, actorId) {
  const role = await roleRepository.findByName(roleName);
  if (!role) {
    throw new ApiError(400, `Unknown role: ${roleName}`);
  }

  const existing = await userRepository.findByEmail(userFields.email);
  if (existing) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  let finalPassword = password;
  if (!finalPassword) {
    finalPassword = profile?.employeeId || profile?.rollNumber || userFields.email;
  }

  const passwordHash = await bcrypt.hash(finalPassword, PASSWORD_SALT_ROUNDS);
  const profileRelation = ROLE_PROFILE_RELATION[roleName];

  const user = await userRepository.createUserWithProfile({
    ...userFields,
    passwordHash,
    roleId: role.id,
    profileRelation,
    profileData: profile,
  });

  await auditLogRepository.log({
    actorId,
    action: 'USER_CREATED',
    entityType: 'User',
    entityId: user.id,
  });

  return toPublicUser(user);
}

async function listUsers({ page, limit, role, departmentId, isActive }) {
  let roleId;
  if (role) {
    const roleRecord = await roleRepository.findByName(role);
    if (!roleRecord) {
      throw new ApiError(400, `Unknown role: ${role}`);
    }
    roleId = roleRecord.id;
  }

  const [users, total] = await userRepository.listUsers({ page, limit, roleId, departmentId, isActive });

  return {
    users: users.map(toPublicUserWithProfile),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getUser(id, requester) {
  const requesterObj = (typeof requester === 'object' && requester !== null)
    ? requester
    : (requester !== undefined ? { id: Number(requester), role: 'ADMIN' } : null);

  const { isEffectiveAdmin } = require('../utils/roleMapper');
  if (requesterObj && requesterObj.id !== id && !isEffectiveAdmin(requesterObj.role)) {
    throw new ApiError(403, 'You can only view your own profile');
  }

  const user = await userRepository.findByIdWithProfile(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return toPublicUserWithProfile(user);
}

async function updateUser(id, data, requester) {
  const numId = Number(id);
  const requesterObj = (typeof requester === 'object' && requester !== null)
    ? requester
    : (requester !== undefined ? { id: Number(requester), role: 'ADMIN' } : null);

  const { isEffectiveAdmin } = require('../utils/roleMapper');
  if (requesterObj && requesterObj.id !== numId && !isEffectiveAdmin(requesterObj.role)) {
    throw new ApiError(403, 'You can only update your own profile');
  }

  const existing = await userRepository.findByIdWithProfile(numId);
  if (!existing) {
    throw new ApiError(404, 'User not found');
  }

  const isSelf = requesterObj && requesterObj.id === numId && !isEffectiveAdmin(requesterObj.role);

  const { profile, ...userFields } = data;
  let allowedUserFields = { ...userFields };
  if (allowedUserFields.password) {
    const bcrypt = require('bcrypt');
    allowedUserFields.passwordHash = await bcrypt.hash(allowedUserFields.password, 10);
    delete allowedUserFields.password;
  }
  if (allowedUserFields.faceFileName) {
    allowedUserFields.faceEmbeddingPath = "uploads/faces/" + allowedUserFields.faceFileName;
    delete allowedUserFields.faceFileName;
  }
  let allowedProfileFields = profile ? { ...profile } : undefined;
  if (allowedProfileFields && allowedProfileFields.dob) {
    allowedProfileFields.dob = new Date(allowedProfileFields.dob);
  }

  if (isSelf) {
    allowedUserFields = {};
    if (userFields.phone !== undefined) allowedUserFields.phone = userFields.phone;
    // Email change by user not allowed

    if (profile) {
      allowedProfileFields = {};
      if (profile.parentName !== undefined) allowedProfileFields.parentName = profile.parentName;
      if (profile.parentPhone !== undefined) allowedProfileFields.parentPhone = profile.parentPhone;
      if (profile.address !== undefined) allowedProfileFields.address = profile.address;
    }
  }

  const roleName = existing.role?.name || existing.role;
  const profileRelation = ROLE_PROFILE_RELATION[roleName];

  const updated = await userRepository.updateUserWithProfile(
    numId,
    allowedUserFields,
    profileRelation,
    allowedProfileFields
  );

  if (updated.rfidCardId && updated.faceEmbeddingPath && updated.faceEmbeddingPath.startsWith('uploads')) {
    const fs = require('fs');
    const path = require('path');
    
    const sourcePath = path.join(__dirname, '..', '..', updated.faceEmbeddingPath);
    const targetDir = path.join(__dirname, '..', '..', '..', 'face-recognition', 'faces', updated.rfidCardId);
    const targetPath = path.join(targetDir, 'face.jpg');

    if (fs.existsSync(sourcePath)) {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.copyFileSync(sourcePath, targetPath);
      fs.unlinkSync(sourcePath);
      
      await require('../repositories/user.repository').updateUserWithProfile(
        numId,
        { faceEmbeddingPath: `face-recognition/faces/${updated.rfidCardId}/face.jpg` },
        null,
        null
      );
      
      updated.faceEmbeddingPath = `face-recognition/faces/${updated.rfidCardId}/face.jpg`;
    }
  }

  await auditLogRepository.log({
    actorId: requesterObj?.id || numId,
    action: 'USER_UPDATED',
    entityType: 'User',
    entityId: numId,
  });

  return toPublicUserWithProfile(updated);
}

async function deleteUser(id, actorId) {
  const existing = await userRepository.findById(id);
  if (!existing) {
    throw new ApiError(404, 'User not found');
  }

  await userRepository.deleteUser(id);

  await auditLogRepository.log({
    actorId,
    action: 'USER_DELETED',
    entityType: 'User',
    entityId: id,
  });
}

module.exports = { createUser, listUsers, getUser, updateUser, deleteUser };
