const prisma = require('../config/database');

function create(data) {
  return prisma.announcement.create({
    data,
    include: { issuedBy: { select: { id: true, fullName: true } } },
  });
}

function list({ category, targetRole, page, limit }) {
  const where = {
    ...(category && { category }),
    ...(targetRole && { OR: [{ targetRole }, { targetRole: 'ALL' }] }),
  };

  const p = page || 1;
  const l = limit || 20;

  return Promise.all([
    prisma.announcement.findMany({
      where,
      include: { issuedBy: { select: { id: true, fullName: true } } },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      skip: (p - 1) * l,
      take: l,
    }),
    prisma.announcement.count({ where }),
  ]);
}

function findById(id) {
  return prisma.announcement.findUnique({ where: { id } });
}

function setPinned(id, isPinned) {
  return prisma.announcement.update({ where: { id }, data: { isPinned } });
}

function remove(id) {
  return prisma.announcement.delete({ where: { id } });
}

module.exports = { create, list, findById, setPinned, remove };
