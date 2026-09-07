const ApiError = require('../utils/ApiError');
const deviceRepository = require('../repositories/device.repository');
const { compareApiKey } = require('../utils/apiKey');

/**
 * Authenticates an ESP32 terminal (not a User). Devices send their identity
 * via headers rather than a JWT, since they don't log in.
 */
async function authenticateDevice(req, res, next) {
  const deviceCode = req.headers['x-device-code'];
  const apiKey = req.headers['x-device-api-key'];

  if (!deviceCode || !apiKey) {
    return next(new ApiError(401, 'Device credentials missing'));
  }

  try {
    const device = await deviceRepository.findByCode(deviceCode);
    if (!device) {
      return next(new ApiError(401, 'Invalid device credentials'));
    }

    const keyMatches = await compareApiKey(apiKey, device.apiKeyHash);
    if (!keyMatches) {
      return next(new ApiError(401, 'Invalid device credentials'));
    }

    if (device.status === 'DECOMMISSIONED') {
      return next(new ApiError(403, 'This device has been decommissioned'));
    }

    req.device = device;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticateDevice;
