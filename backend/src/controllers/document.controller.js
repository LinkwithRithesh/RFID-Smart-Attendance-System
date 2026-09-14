const documentService = require('../services/document.service');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/apiResponse');

async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      throw new ApiError(400, 'A file is required');
    }
    const doc = await documentService.uploadDocument(req.body, req.file, req.user.id);
    return success(res, 201, 'Document uploaded', doc);
  } catch (err) {
    next(err);
  }
}

async function listDocuments(req, res, next) {
  try {
    const result = await documentService.listDocuments(req.query);
    return success(res, 200, 'Documents retrieved', result);
  } catch (err) {
    next(err);
  }
}

async function download(req, res, next) {
  try {
    const { filePath, fileName } = await documentService.getDownload(req.params.id);
    res.download(filePath, fileName);
  } catch (err) {
    next(err);
  }
}

async function deleteDocument(req, res, next) {
  try {
    await documentService.deleteDocument(req.params.id, req.user.id);
    return success(res, 200, 'Document deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadDocument, listDocuments, download, deleteDocument };
