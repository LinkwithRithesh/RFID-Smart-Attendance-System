const roleService = require('../services/role.service');
const { success } = require('../utils/apiResponse');

async function listRoles(req, res, next) {
  try {
    const roles = await roleService.listRoles();
    return success(res, 200, 'Roles retrieved', roles);
  } catch (err) {
    next(err);
  }
}

async function listPermissions(req, res, next) {
  try {
    const permissions = await roleService.listPermissions();
    return success(res, 200, 'Permissions retrieved', permissions);
  } catch (err) {
    next(err);
  }
}

async function createPermission(req, res, next) {
  try {
    const permission = await roleService.createPermission(req.body);
    return success(res, 201, 'Permission created', permission);
  } catch (err) {
    next(err);
  }
}

async function listPermissionsForRole(req, res, next) {
  try {
    const permissions = await roleService.listPermissionsForRole(req.params.roleId);
    return success(res, 200, 'Role permissions retrieved', permissions);
  } catch (err) {
    next(err);
  }
}

async function assignPermission(req, res, next) {
  try {
    await roleService.assignPermission(req.params.roleId, req.body.permissionId, req.user.id);
    return success(res, 200, 'Permission assigned to role');
  } catch (err) {
    next(err);
  }
}

async function revokePermission(req, res, next) {
  try {
    await roleService.revokePermission(req.params.roleId, req.params.permissionId, req.user.id);
    return success(res, 200, 'Permission revoked from role');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listRoles,
  listPermissions,
  createPermission,
  listPermissionsForRole,
  assignPermission,
  revokePermission,
};
