jest.mock('../src/repositories/role.repository', () => ({
  findById: jest.fn(),
  listRoles: jest.fn(),
  listPermissions: jest.fn(),
  createPermission: jest.fn(),
  listPermissionsForRole: jest.fn(),
  assignPermission: jest.fn(),
  revokePermission: jest.fn(),
}));
jest.mock('../src/repositories/auditLog.repository', () => ({
  log: jest.fn(),
}));

const roleRepository = require('../src/repositories/role.repository');
const auditLogRepository = require('../src/repositories/auditLog.repository');
const roleService = require('../src/services/role.service');

beforeEach(() => {
  jest.clearAllMocks();
  auditLogRepository.log.mockResolvedValue({});
});

describe('listPermissionsForRole', () => {
  test('throws 404 for an unknown role', async () => {
    roleRepository.findById.mockResolvedValue(null);
    await expect(roleService.listPermissionsForRole(999)).rejects.toMatchObject({ statusCode: 404 });
  });

  test('unwraps the join rows to plain permission objects', async () => {
    roleRepository.findById.mockResolvedValue({ id: 1, name: 'DEAN' });
    roleRepository.listPermissionsForRole.mockResolvedValue([
      { roleId: 1, permissionId: 10, permission: { id: 10, name: 'OVERRIDE_ATTENDANCE' } },
    ]);

    const result = await roleService.listPermissionsForRole(1);
    expect(result).toEqual([{ id: 10, name: 'OVERRIDE_ATTENDANCE' }]);
  });
});

describe('assignPermission', () => {
  test('throws 404 for an unknown role and never calls assign', async () => {
    roleRepository.findById.mockResolvedValue(null);
    await expect(roleService.assignPermission(999, 5, 1)).rejects.toMatchObject({ statusCode: 404 });
    expect(roleRepository.assignPermission).not.toHaveBeenCalled();
  });

  test('assigns the permission and logs an audit entry', async () => {
    roleRepository.findById.mockResolvedValue({ id: 1, name: 'DEAN' });
    roleRepository.assignPermission.mockResolvedValue({});

    await roleService.assignPermission(1, 5, 99);

    expect(roleRepository.assignPermission).toHaveBeenCalledWith(1, 5);
    expect(auditLogRepository.log).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 99, action: 'PERMISSION_ASSIGNED', entityId: 1 })
    );
  });
});

describe('revokePermission', () => {
  test('throws 404 for an unknown role and never calls revoke', async () => {
    roleRepository.findById.mockResolvedValue(null);
    await expect(roleService.revokePermission(999, 5, 1)).rejects.toMatchObject({ statusCode: 404 });
    expect(roleRepository.revokePermission).not.toHaveBeenCalled();
  });

  test('revokes the permission and logs an audit entry', async () => {
    roleRepository.findById.mockResolvedValue({ id: 1, name: 'DEAN' });
    roleRepository.revokePermission.mockResolvedValue({});

    await roleService.revokePermission(1, 5, 99);

    expect(roleRepository.revokePermission).toHaveBeenCalledWith(1, 5);
    expect(auditLogRepository.log).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 99, action: 'PERMISSION_REVOKED', entityId: 1 })
    );
  });
});
