const prisma = require('../config/database');

function findByCode(deviceCode) {
  return prisma.device.findUnique({ where: { deviceCode } });
}

function findById(id) {
  return prisma.device.findUnique({ where: { id } });
}

function create({ deviceCode, apiKeyHash, location, departmentId, firmwareVersion }) {
  return prisma.device.create({
    data: { deviceCode, apiKeyHash, location, departmentId, firmwareVersion },
  });
}

function list({ page, limit, departmentId, status }) {
  const where = {
    ...(departmentId && { departmentId }),
    ...(status && { status }),
  };

  return Promise.all([
    prisma.device.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: 'asc' },
    }),
    prisma.device.count({ where }),
  ]);
}

function update(id, data) {
  return prisma.device.update({ where: { id }, data });
}

function updateApiKeyHash(id, apiKeyHash) {
  return prisma.device.update({ where: { id }, data: { apiKeyHash } });
}

function decommission(id) {
  return prisma.device.update({ where: { id }, data: { status: 'DECOMMISSIONED' } });
}

function recordHeartbeat(id, { status, firmwareVersion }) {
  return prisma.device.update({
    where: { id },
    data: {
      lastHeartbeatAt: new Date(),
      status,
      ...(firmwareVersion && { firmwareVersion }),
    },
  });
}

module.exports = {
  findByCode,
  findById,
  create,
  list,
  update,
  updateApiKeyHash,
  decommission,
  recordHeartbeat,
};
