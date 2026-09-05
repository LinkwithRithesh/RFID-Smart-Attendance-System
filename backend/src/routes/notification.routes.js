const express = require('express');
const notificationController = require('../controllers/notification.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
  lowAttendanceAlertSchema,
} = require('../validations/notification.validation');

const router = express.Router();

router.use(authenticate);

// Self-service: any authenticated user reads/manages their own notifications.
router.get('/', validate(listNotificationsQuerySchema), notificationController.listNotifications);
router.patch('/:id/read', validate(notificationIdParamSchema), notificationController.markAsRead);

// Staff-triggered (no cron scheduler in scope — see notification.service).
router.post(
  '/low-attendance-alerts',
  authorize('HOD', 'DEAN', 'ADMINISTRATOR'),
  validate(lowAttendanceAlertSchema),
  notificationController.sendLowAttendanceAlerts
);

module.exports = router;
