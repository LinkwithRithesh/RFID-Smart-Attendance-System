const prisma = require('../config/database');

function create(data) {
  return prisma.documentFile.create({ data });
}

function list({ category, page, limit }) {
  const where = { ...(category && { category }) };
  return Promise.all([
    prisma.documentFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.documentFile.count({ where }),
  ]);
}

function findById(id) {
  return prisma.documentFile.findUnique({ where: { id } });
}

function incrementDownloads(id) {
  return prisma.documentFile.update({
    where: { id },
    data: { downloadsCount: { increment: 1 } },
  });
}

function remove(id) {
  return prisma.documentFile.delete({ where: { id } });
}

module.exports = { create, list, findById, incrementDownloads, remove };
