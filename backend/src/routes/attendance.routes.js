const express = require('express');
const attendanceController = require('../controllers/attendance.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const authenticateDevice = require('../middleware/authenticateDevice');
const validate = require('../middleware/validate');
const {
  markDeviceAttendanceSchema,
  markManualAttendanceSchema,
  sessionIdParamSchema,
} = require('../validations/attendance.validation');
const { syncRecordsSchema } = require('../validations/sync.validation');

const router = express.Router();

// Student / User-facing attendance analytics
router.get('/summary', authenticate, attendanceController.getStudentSummary);
router.get('/subjects', authenticate, attendanceController.getStudentSubjects);
router.get('/calendar', authenticate, attendanceController.getSubjectCalendar);
router.post('/verify-face', authenticate, attendanceController.verifyFace);

// Device-facing: RFID swipe at a terminal (face match already confirmed on-device).
router.post('/mark', authenticateDevice, validate(markDeviceAttendanceSchema), attendanceController.markViaDevice);

// Device-facing: batch upload of records cached while offline.
router.post('/sync', authenticateDevice, validate(syncRecordsSchema), attendanceController.sync);

// Staff-facing: manual override marking and roster viewing.
const staffRoles = authorize('FACULTY', 'HOD', 'DEAN', 'ADMINISTRATOR', 'ADMIN');
router.post('/manual', authenticate, staffRoles, validate(markManualAttendanceSchema), attendanceController.markManual);
router.get(
  '/sessions/:sessionId',
  authenticate,
  staffRoles,
  validate(sessionIdParamSchema),
  attendanceController.listSessionAttendance
);

module.exports = router;
