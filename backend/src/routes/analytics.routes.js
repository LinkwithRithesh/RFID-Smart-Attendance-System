const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  userIdParamSchema,
  departmentIdParamSchema,
  lowAttendanceQuerySchema,
} = require('../validations/analytics.validation');

const router = express.Router();

const staffRoles = authorize('FACULTY', 'HOD', 'DEAN', 'ADMINISTRATOR');

router.get('/user/:userId', authenticate, staffRoles, validate(userIdParamSchema), analyticsController.userPercentage);
router.get(
  '/department/:departmentId',
  authenticate,
  staffRoles,
  validate(departmentIdParamSchema),
  analyticsController.departmentSummary
);
router.get(
  '/department/:departmentId/low-attendance',
  authenticate,
  staffRoles,
  validate(lowAttendanceQuerySchema),
  analyticsController.lowAttendance
);

module.exports = router;
