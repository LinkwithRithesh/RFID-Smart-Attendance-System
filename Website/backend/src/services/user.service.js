const bcrypt = require('bcrypt');
const ApiError = require('../utils/ApiError');
const userRepository = require('../repositories/user.repository');
const roleRepository = require('../repositories/role.repository');
const auditLogRepository = require('../repositories/auditLog.repository');
const { ROLE_PROFILE_RELATION } = require('../utils/roleProfileMap');

const PASSWORD_SALT_ROUNDS = 10;

function toPublicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone || null,
    role: user.role?.name || user.role,
    departmentId: user.departmentId,
    isActive: user.isActive,
  };
}

// Adds departmentName + the role-specific profile object when the query
// included those relations (listUsers and getUser both do; findById/findByEmail
// used by auth don't, and user.department/user[profileRelation] are simply
// undefined there, which this handles safely).
//
// rfidCardId is passed through so the admin UI can display the UID or
// "Not Registered". hasFaceEmbedding is a boolean derived from
// faceEmbeddingPath — the raw server-side path is intentionally never
// serialised to the client.
function toPublicUserWithProfile(user) {
  const roleName = user.role?.name || user.role;
  const profileRelation = ROLE_PROFILE_RELATION[roleName];
  return {
    ...toPublicUser(user),
    departmentName: user.department?.name || null,
    profile: user[profileRelation] || null,
    rfidCardId: user.rfidCardId || null,
    hasFaceEmbedding: !!user.faceEmbeddingPath,
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

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
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

/**
 * Any user may fetch their own full profile; only an ADMINISTRATOR may
 * fetch someone else's. `requester` is the authenticated caller (req.user),
 * not the id being looked up.
 */
async function getUser(id, requester) {
  if (requester && requester.id !== id && requester.role !== 'ADMINISTRATOR') {
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
  if (requester && requester.id !== numId && requester.role !== 'ADMINISTRATOR') {
    throw new ApiError(403, 'You can only update your own profile');
  }

  const existing = await userRepository.findByIdWithProfile(numId);
  if (!existing) {
    throw new ApiError(404, 'User not found');
  }

  const isSelf = requester && requester.id === numId && requester.role !== 'ADMINISTRATOR';

  const { profile, ...userFields } = data;
  let allowedUserFields = { ...userFields };
  let allowedProfileFields = profile ? { ...profile } : undefined;

  // Non-admins can only update personal contact info
  if (isSelf) {
    allowedUserFields = {};
    if (userFields.phone !== undefined) allowedUserFields.phone = userFields.phone;
    if (userFields.email !== undefined) allowedUserFields.email = userFields.email;

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

  await auditLogRepository.log({
    actorId: requester?.id || numId,
    action: 'USER_UPDATED',
    entityType: 'User',
    entityId: numId,
  });

  return toPublicUserWithProfile(updated);
}

async function deactivateUser(id, actorId) {
  const existing = await userRepository.findById(id);
  if (!existing) {
    throw new ApiError(404, 'User not found');
  }
  if (!existing.isActive) {
    throw new ApiError(409, 'User is already deactivated');
  }

  await userRepository.deactivateUser(id);

  await auditLogRepository.log({
    actorId,
    action: 'USER_DEACTIVATED',
    entityType: 'User',
    entityId: id,
  });
}

module.exports = { createUser, listUsers, getUser, updateUser, deactivateUser };
