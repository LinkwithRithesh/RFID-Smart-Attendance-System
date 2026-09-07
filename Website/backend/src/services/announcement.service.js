const ApiError = require('../utils/ApiError');
const announcementRepository = require('../repositories/announcement.repository');
const auditLogRepository = require('../repositories/auditLog.repository');

function toPublic(a) {
  return {
    id: a.id,
    referenceNo: a.referenceNo,
    title: a.title,
    message: a.message,
    category: a.category,
    priority: a.priority,
    targetRole: a.targetRole,
    issuedBy: a.issuedBy?.fullName || 'CeGov Portal Controller',
    dateIssued: a.dateIssued,
    isPinned: a.isPinned,
    createdAt: a.createdAt,
  };
}

async function createAnnouncement(data, actorId) {
  const announcement = await announcementRepository.create({
    ...data,
    dateIssued: new Date(),
    issuedById: actorId,
  });

  await auditLogRepository.log({
    actorId,
    action: 'ANNOUNCEMENT_CREATED',
    entityType: 'Announcement',
    entityId: announcement.id,
  });

  return toPublic(announcement);
}

async function listAnnouncements(query) {
  const [rows, total] = await announcementRepository.list(query);
  return {
    announcements: rows.map(toPublic),
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  };
}

async function togglePin(id, isPinned, actorId) {
  const existing = await announcementRepository.findById(id);
  if (!existing) {
    throw new ApiError(404, 'Announcement not found');
  }

  const updated = await announcementRepository.setPinned(id, isPinned);

  await auditLogRepository.log({
    actorId,
    action: isPinned ? 'ANNOUNCEMENT_PINNED' : 'ANNOUNCEMENT_UNPINNED',
    entityType: 'Announcement',
    entityId: id,
  });

  return toPublic(updated);
}

async function deleteAnnouncement(id, actorId) {
  const existing = await announcementRepository.findById(id);
  if (!existing) {
    throw new ApiError(404, 'Announcement not found');
  }

  await announcementRepository.remove(id);

  await auditLogRepository.log({
    actorId,
    action: 'ANNOUNCEMENT_DELETED',
    entityType: 'Announcement',
    entityId: id,
  });
}

module.exports = { createAnnouncement, listAnnouncements, togglePin, deleteAnnouncement };
