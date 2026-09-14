const prisma = require('../config/database');

function log({ actorId, action, entityType, entityId = null, ipAddress = null }) {
  return prisma.auditLog.create({
    data: { actorId, action, entityType, entityId, ipAddress },
  });
}

module.exports = { log };
