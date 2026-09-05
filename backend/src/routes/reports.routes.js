const express = require('express');
const reportsController = require('../controllers/reports.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { reportFormatQuerySchema } = require('../validations/analytics.validation');

const router = express.Router();

router.get(
  '/department/:departmentId',
  authenticate,
  authorize('FACULTY', 'HOD', 'DEAN', 'ADMINISTRATOR'),
  validate(reportFormatQuerySchema),
  reportsController.departmentReport
);

// Student Attendance Statement & Official Export
router.get('/statement', authenticate, reportsController.getStudentStatement);
router.get('/statement/export', authenticate, reportsController.exportStudentStatement);

module.exports = router;
