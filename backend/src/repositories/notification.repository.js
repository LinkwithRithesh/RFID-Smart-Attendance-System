const prisma = require('../config/database');

function create(data) {
  return prisma.notification.create({ data });
}

function updateStatus(id, status) {
  return prisma.notification.update({ where: { id }, data: { status } });
}

function findById(id) {
  return prisma.notification.findUnique({ where: { id } });
}

function listForUser(userId, { page, limit, unreadOnly }) {
  const where = { userId, ...(unreadOnly && { readAt: null }) };
  return Promise.all([
    prisma.notification.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
  ]);
}

function markRead(id) {
  return prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
}

module.exports = { create, updateStatus, findById, listForUser, markRead };
