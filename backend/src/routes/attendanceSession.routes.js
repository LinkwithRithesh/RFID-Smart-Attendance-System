const express = require('express');
const attendanceSessionController = require('../controllers/attendanceSession.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { openManualSessionSchema, sessionIdParamSchema } = require('../validations/attendanceSession.validation');

const router = express.Router();

// Public/Authenticated active session view for classroom telemetry map
router.get('/active', authenticate, attendanceSessionController.getActiveSessions);

// Real-time SSE stream for a specific session
router.get('/:id/stream', authenticate, attendanceSessionController.streamSessionEvents);

// Short-interval polling fallback for session events
router.get('/:id/events', authenticate, attendanceSessionController.getSessionEvents);

// Session control (Faculty / Admin)
const staffRoles = authorize('FACULTY', 'HOD', 'DEAN', 'ADMINISTRATOR', 'ADMIN');
router.post('/start', authenticate, staffRoles, validate(openManualSessionSchema), attendanceSessionController.openManualSession);
router.patch('/pause', authenticate, staffRoles, (req, res) => res.json({ success: true, message: 'Session paused' }));
router.patch('/end', authenticate, staffRoles, (req, res) => res.json({ success: true, message: 'Session ended' }));

// Existing HOD/DEAN/ADMIN manual session control
router.post('/manual-open', authenticate, authorize('HOD', 'DEAN', 'ADMINISTRATOR', 'ADMIN'), validate(openManualSessionSchema), attendanceSessionController.openManualSession);
router.post('/:id/close', authenticate, authorize('HOD', 'DEAN', 'ADMINISTRATOR', 'ADMIN'), validate(sessionIdParamSchema), attendanceSessionController.closeSession);

module.exports = router;
