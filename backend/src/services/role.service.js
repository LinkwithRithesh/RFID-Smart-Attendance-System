const ApiError = require('../utils/ApiError');
const roleRepository = require('../repositories/role.repository');
const auditLogRepository = require('../repositories/auditLog.repository');

async function listRoles() {
  return roleRepository.listRoles();
}

async function listPermissions() {
  return roleRepository.listPermissions();
}

async function createPermission({ name, description }) {
  return roleRepository.createPermission({ name, description });
}

async function listPermissionsForRole(roleId) {
  const role = await roleRepository.findById(roleId);
  if (!role) {
    throw new ApiError(404, 'Role not found');
  }
  const rolePermissions = await roleRepository.listPermissionsForRole(roleId);
  return rolePermissions.map((rp) => rp.permission);
}

async function assignPermission(roleId, permissionId, actorId) {
  const role = await roleRepository.findById(roleId);
  if (!role) {
    throw new ApiError(404, 'Role not found');
  }

  await roleRepository.assignPermission(roleId, permissionId);

  await auditLogRepository.log({
    actorId,
    action: 'PERMISSION_ASSIGNED',
    entityType: 'Role',
    entityId: roleId,
  });
}

async function revokePermission(roleId, permissionId, actorId) {
  const role = await roleRepository.findById(roleId);
  if (!role) {
    throw new ApiError(404, 'Role not found');
  }

  await roleRepository.revokePermission(roleId, permissionId);

  await auditLogRepository.log({
    actorId,
    action: 'PERMISSION_REVOKED',
    entityType: 'Role',
    entityId: roleId,
  });
}

module.exports = {
  listRoles,
  listPermissions,
  createPermission,
  listPermissionsForRole,
  assignPermission,
  revokePermission,
};
