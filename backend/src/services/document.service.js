const fs = require('fs');
const path = require('path');
const ApiError = require('../utils/ApiError');
const documentRepository = require('../repositories/document.repository');
const auditLogRepository = require('../repositories/auditLog.repository');
const logger = require('../config/logger');

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toPublic(doc) {
  return {
    id: doc.id,
    title: doc.title,
    code: doc.code,
    category: doc.category,
    description: doc.description,
    fileSize: formatFileSize(doc.fileSizeBytes),
    downloadsCount: doc.downloadsCount,
    updatedDate: doc.updatedAt,
  };
}

async function uploadDocument({ title, code, category, description }, file, actorId) {
  const doc = await documentRepository.create({
    title,
    code,
    category,
    description,
    filePath: file.path,
    fileSizeBytes: file.size,
    uploadedById: actorId,
  });

  await auditLogRepository.log({
    actorId,
    action: 'DOCUMENT_UPLOADED',
    entityType: 'DocumentFile',
    entityId: doc.id,
  });

  return toPublic(doc);
}

async function listDocuments(query) {
  const [rows, total] = await documentRepository.list(query);
  return {
    documents: rows.map(toPublic),
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  };
}

async function getDownload(id) {
  const doc = await documentRepository.findById(id);
  if (!doc) {
    throw new ApiError(404, 'Document not found');
  }
  if (!fs.existsSync(doc.filePath)) {
    throw new ApiError(404, 'The file for this document is missing on disk');
  }

  await documentRepository.incrementDownloads(id);
  return { filePath: doc.filePath, fileName: `${doc.code}${path.extname(doc.filePath)}` };
}

async function deleteDocument(id, actorId) {
  const doc = await documentRepository.findById(id);
  if (!doc) {
    throw new ApiError(404, 'Document not found');
  }

  await documentRepository.remove(id);

  // Best-effort file cleanup — a failed unlink shouldn't fail the delete,
  // since the DB record (the source of truth for listings) is already gone.
  fs.unlink(doc.filePath, (err) => {
    if (err) logger.error('Failed to remove document file from disk', { path: doc.filePath, error: err.message });
  });

  await auditLogRepository.log({
    actorId,
    action: 'DOCUMENT_DELETED',
    entityType: 'DocumentFile',
    entityId: id,
  });
}

module.exports = { formatFileSize, uploadDocument, listDocuments, getDownload, deleteDocument };
