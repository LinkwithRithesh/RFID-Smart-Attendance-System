const deviceService = require('../services/device.service');
const { success } = require('../utils/apiResponse');

async function registerDevice(req, res, next) {
  try {
    const device = await deviceService.registerDevice(req.body, req.user.id);
    return success(res, 201, 'Device registered', device);
  } catch (err) {
    next(err);
  }
}

async function listDevices(req, res, next) {
  try {
    const result = await deviceService.listDevices(req.query);
    return success(res, 200, 'Devices retrieved', result);
  } catch (err) {
    next(err);
  }
}

async function getDevice(req, res, next) {
  try {
    const device = await deviceService.getDevice(req.params.id);
    return success(res, 200, 'Device retrieved', device);
  } catch (err) {
    next(err);
  }
}

async function updateDevice(req, res, next) {
  try {
    const device = await deviceService.updateDevice(req.params.id, req.body, req.user.id);
    return success(res, 200, 'Device updated', device);
  } catch (err) {
    next(err);
  }
}

async function decommissionDevice(req, res, next) {
  try {
    await deviceService.decommissionDevice(req.params.id, req.user.id);
    return success(res, 200, 'Device decommissioned');
  } catch (err) {
    next(err);
  }
}

async function rotateApiKey(req, res, next) {
  try {
    const result = await deviceService.rotateApiKey(req.params.id, req.user.id);
    return success(res, 200, 'Device API key rotated', result);
  } catch (err) {
    next(err);
  }
}

async function heartbeat(req, res, next) {
  try {
    const device = await deviceService.recordHeartbeat(req.device, req.body.firmwareVersion);
    return success(res, 200, 'Heartbeat recorded', device);
  } catch (err) {
    next(err);
  }
}

async function restartDevice(req, res, next) {
  try {
    const result = await deviceService.restartDevice(req.params.id, req.user);
    return success(res, 200, result.message, result);
  } catch (err) {
    next(err);
  }
}

async function testBuzzer(req, res, next) {
  try {
    const result = await deviceService.testBuzzer(req.params.id, req.user);
    return success(res, 200, result.message, result);
  } catch (err) {
    next(err);
  }
}

async function streamTelemetry(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const eventBus = require('../utils/eventBus');
  const onTelemetry = (device) => {
    res.write(`event: telemetry\ndata: ${JSON.stringify(device)}\n\n`);
  };

  eventBus.on('device:telemetry', onTelemetry);

  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    eventBus.removeListener('device:telemetry', onTelemetry);
  });
}

async function getUserFaceByRfid(req, res, next) {
  try {
    const { rfidCardId } = req.params;
    if (!rfidCardId) {
      return res.status(400).json({ success: false, message: 'RFID card ID is required' });
    }
    const prisma = require('../config/database');
    const path = require('path');
    const fs = require('fs');

    const user = await prisma.user.findUnique({
      where: { rfidCardId: rfidCardId },
      select: { faceEmbeddingPath: true, status: true, isActive: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.status !== 'APPROVED' || !user.isActive) {
      return res.status(403).json({ success: false, message: 'User is inactive or not approved' });
    }
    if (!user.faceEmbeddingPath) {
      return res.status(404).json({ success: false, message: 'User has no registered face' });
    }

    // Resolve the absolute path
    const absolutePath = path.resolve(__dirname, '..', '..', user.faceEmbeddingPath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'Face image file not found on server' });
    }

    res.sendFile(absolutePath);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerDevice,
  listDevices,
  getDevice,
  updateDevice,
  decommissionDevice,
  rotateApiKey,
  heartbeat,
  restartDevice,
  testBuzzer,
  streamTelemetry,
  getUserFaceByRfid,
};
