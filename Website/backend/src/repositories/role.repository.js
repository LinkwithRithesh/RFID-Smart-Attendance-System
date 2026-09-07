const prisma = require('../config/database');

function findByName(name) {
  return prisma.role.findUnique({ where: { name } });
}

function findById(id) {
  return prisma.role.findUnique({ where: { id } });
}

function listRoles() {
  return prisma.role.findMany({ orderBy: { id: 'asc' } });
}

function listPermissions() {
  return prisma.permission.findMany({ orderBy: { id: 'asc' } });
}

function createPermission({ name, description }) {
  return prisma.permission.create({ data: { name, description } });
}

function listPermissionsForRole(roleId) {
  return prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: true },
  });
}

function assignPermission(roleId, permissionId) {
  return prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId, permissionId } },
    create: { roleId, permissionId },
    update: {},
  });
}

function revokePermission(roleId, permissionId) {
  return prisma.rolePermission.delete({
    where: { roleId_permissionId: { roleId, permissionId } },
  });
}

module.exports = {
  findByName,
  findById,
  listRoles,
  listPermissions,
  createPermission,
  listPermissionsForRole,
  assignPermission,
  revokePermission,
};
