const prisma = require('../config/database');
const { ROLE_PROFILE_RELATION } = require('../utils/roleProfileMap');

// All profile relations included on every fetch; only the one matching the
// user's role will be non-null. Simpler than conditionally building the
// include object per role, and the extra relations are cheap (1:1, empty).
// All profile relations included on every fetch; only the one matching the
// user's role will be non-null. Student profile also includes course relation.
const ALL_PROFILE_INCLUDES = {
  ...Object.values(ROLE_PROFILE_RELATION).reduce(
    (acc, relation) => ({ ...acc, [relation]: true }),
    {}
  ),
  studentProfile: {
    include: { course: true },
  },
};

function findByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });
}

async function findByEmailOrIdentifier(identifier) {
  if (!identifier) return null;
  if (identifier.includes('@')) {
    return prisma.user.findUnique({
      where: { email: identifier },
      include: { role: true },
    });
  }

  const student = await prisma.studentProfile.findUnique({
    where: { rollNumber: identifier },
    include: { user: { include: { role: true } } },
  });
  if (student) return student.user;

  const faculty = await prisma.facultyProfile.findUnique({
    where: { employeeId: identifier },
    include: { user: { include: { role: true } } },
  });
  if (faculty) return faculty.user;

  const admin = await prisma.administratorProfile.findUnique({
    where: { employeeId: identifier },
    include: { user: { include: { role: true } } },
  });
  if (admin) return admin.user;

  const hod = await prisma.hodProfile.findUnique({
    where: { employeeId: identifier },
    include: { user: { include: { role: true } } },
  });
  if (hod) return hod.user;

  return null;
}

function findByRfidCardId(rfidCardId) {
  return prisma.user.findUnique({
    where: { rfidCardId },
    include: { role: true },
  });
}

function findById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });
}

function findByIdWithProfile(id) {
  return prisma.user.findUnique({
    where: { id },
    include: { role: true, department: true, ...ALL_PROFILE_INCLUDES },
  });
}

function updateRefreshTokenHash(userId, refreshTokenHash) {
  return prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash },
  });
}

/**
 * Creates the user row and its role-specific profile row in one transaction
 * so a partially-created user (no profile) can never exist.
 */
function createUserWithProfile({ fullName, email, passwordHash, roleId, departmentId, phone, rfidCardId, profileRelation, profileData }) {
  return prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      roleId,
      departmentId,
      phone: phone || null,
      rfidCardId: rfidCardId || null,
      [profileRelation]: { create: profileData },
    },
    include: { role: true, [profileRelation]: true },
  });
}

function listUsers({ page, limit, roleId, departmentId, isActive }) {
  const where = {
    ...(roleId && { roleId }),
    ...(departmentId && { departmentId }),
    ...(isActive !== undefined && { isActive }),
  };

  return Promise.all([
    prisma.user.findMany({
      where,
      include: { role: true, department: true, ...ALL_PROFILE_INCLUDES },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: 'asc' },
    }),
    prisma.user.count({ where }),
  ]);
}

function updateUser(id, data) {
  return prisma.user.update({
    where: { id },
    data,
    include: { role: true },
  });
}

function updateUserWithProfile(id, userData, profileRelation, profileData) {
  return prisma.$transaction(async (tx) => {
    if (userData && Object.keys(userData).length > 0) {
      await tx.user.update({
        where: { id },
        data: userData,
      });
    }
    if (profileRelation && profileData && Object.keys(profileData).length > 0) {
      await tx[profileRelation].update({
        where: { userId: id },
        data: profileData,
      });
    }
    return tx.user.findUnique({
      where: { id },
      include: { role: true, department: true, ...ALL_PROFILE_INCLUDES },
    });
  });
}

function deactivateUser(id) {
  return prisma.user.update({
    where: { id },
    data: { isActive: false, refreshTokenHash: null },
  });
}

module.exports = {
  findByEmail,
  findByEmailOrIdentifier,
  findByRfidCardId,
  findById,
  findByIdWithProfile,
  updateRefreshTokenHash,
  createUserWithProfile,
  listUsers,
  updateUser,
  updateUserWithProfile,
  deactivateUser,
};
