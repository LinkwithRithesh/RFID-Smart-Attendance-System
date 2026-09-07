const express = require('express');
const { z } = require('zod');
const deviceController = require('../controllers/device.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const authenticateDevice = require('../middleware/authenticateDevice');
const validate = require('../middleware/validate');
const {
  createDeviceSchema,
  updateDeviceSchema,
  deviceIdParamSchema,
  listDevicesQuerySchema,
} = require('../validations/device.validation');

const router = express.Router();

const heartbeatSchema = z.object({
  body: z.object({ firmwareVersion: z.string().optional() }),
});

// Device-facing: authenticated by API key, not a user JWT.
router.post('/heartbeat', authenticateDevice, validate(heartbeatSchema), deviceController.heartbeat);

// SSE telemetry stream for real-time fleet view
router.get('/telemetry/stream', authenticate, deviceController.streamTelemetry);

// Admin-facing device management.
router.use(authenticate, authorize('ADMINISTRATOR', 'ADMIN'));
router.post('/', validate(createDeviceSchema), deviceController.registerDevice);
router.get('/', validate(listDevicesQuerySchema), deviceController.listDevices);
router.get('/:id', validate(deviceIdParamSchema), deviceController.getDevice);
router.patch('/:id', validate(updateDeviceSchema), deviceController.updateDevice);
router.post('/:id/rotate-key', validate(deviceIdParamSchema), deviceController.rotateApiKey);
router.post('/:id/restart', validate(deviceIdParamSchema), deviceController.restartDevice);
router.post('/:id/test-buzzer', validate(deviceIdParamSchema), deviceController.testBuzzer);
router.delete('/:id', validate(deviceIdParamSchema), deviceController.decommissionDevice);

module.exports = router;
