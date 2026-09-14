const express = require('express');
const documentController = require('../controllers/document.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { upload } = require('../config/upload');
const {
  uploadDocumentSchema,
  listDocumentsQuerySchema,
  documentIdParamSchema,
} = require('../validations/document.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', validate(listDocumentsQuerySchema), documentController.listDocuments);
router.get('/:id/download', validate(documentIdParamSchema), documentController.download);

const staffRoles = authorize('FACULTY', 'HOD', 'DEAN', 'ADMINISTRATOR', 'OFFICE_STAFF');
router.post(
  '/',
  staffRoles,
  upload.single('file'),
  validate(uploadDocumentSchema),
  documentController.uploadDocument
);
router.delete('/:id', staffRoles, validate(documentIdParamSchema), documentController.deleteDocument);

module.exports = router;
