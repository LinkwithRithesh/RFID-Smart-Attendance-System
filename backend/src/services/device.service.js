const ApiError = require('../utils/ApiError');
const deviceRepository = require('../repositories/device.repository');
const auditLogRepository = require('../repositories/auditLog.repository');
const { generateApiKey, hashApiKey } = require('../utils/apiKey');
const { computeIsOnline, computeSecondsSinceHeartbeat } = require('../utils/deviceOnlineStatus');
const eventBus = require('../utils/eventBus');

function toPublicDevice(device) {
  const isOnline = computeIsOnline(device);
  const secondsSinceHeartbeat = computeSecondsSinceHeartbeat(device);
  const effectiveStatus = device.status === 'DECOMMISSIONED' || device.status === 'MAINTENANCE'
    ? device.status
    : (isOnline ? 'ONLINE' : 'OFFLINE');

  return {
    id: device.id,
    deviceCode: device.deviceCode,
    code: device.deviceCode,
    location: device.location,
    departmentId: device.departmentId,
    status: effectiveStatus,
    firmwareVersion: device.firmwareVersion,
    lastHeartbeatAt: device.lastHeartbeatAt,
    lastSeen: device.lastHeartbeatAt,
    isOnline,
    secondsSinceHeartbeat,
    rfidReader: 'CONNECTED',
    lcdDisplay: 'CONNECTED',
    buzzer: 'CONNECTED',
    wifiStrength: -52,
  };
}

async function registerDevice({ deviceCode, location, departmentId, firmwareVersion }, actorId) {
  const existing = await deviceRepository.findByCode(deviceCode);
  if (existing) {
    throw new ApiError(409, 'A device with this device code already exists');
  }

  const apiKey = generateApiKey();
  const apiKeyHash = await hashApiKey(apiKey);

  const device = await deviceRepository.create({ deviceCode, apiKeyHash, location, departmentId, firmwareVersion });

  await auditLogRepository.log({
    actorId,
    action: 'DEVICE_REGISTERED',
    entityType: 'Device',
    entityId: device.id,
  });

  // apiKey is returned exactly once — only the hash is ever stored.
  return { ...toPublicDevice(device), apiKey };
}

async function listDevices({ page, limit, departmentId, status }) {
  const [devices, total] = await deviceRepository.list({ page, limit, departmentId, status });
  return {
    devices: devices.map(toPublicDevice),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getDevice(id) {
  const device = await deviceRepository.findById(id);
  if (!device) {
    throw new ApiError(404, 'Device not found');
  }
  return toPublicDevice(device);
}

async function updateDevice(id, data, actorId) {
  const existing = await deviceRepository.findById(id);
  if (!existing) {
    throw new ApiError(404, 'Device not found');
  }

  const updated = await deviceRepository.update(id, data);

  await auditLogRepository.log({
    actorId,
    action: 'DEVICE_UPDATED',
    entityType: 'Device',
    entityId: id,
  });

  return toPublicDevice(updated);
}

async function decommissionDevice(id, actorId) {
  const existing = await deviceRepository.findById(id);
  if (!existing) {
    throw new ApiError(404, 'Device not found');
  }
  if (existing.status === 'DECOMMISSIONED') {
    throw new ApiError(409, 'Device is already decommissioned');
  }

  await deviceRepository.decommission(id);

  await auditLogRepository.log({
    actorId,
    action: 'DEVICE_DECOMMISSIONED',
    entityType: 'Device',
    entityId: id,
  });
}

async function rotateApiKey(id, actorId) {
  const existing = await deviceRepository.findById(id);
  if (!existing) {
    throw new ApiError(404, 'Device not found');
  }
  if (existing.status === 'DECOMMISSIONED') {
    throw new ApiError(409, 'Cannot rotate the key of a decommissioned device');
  }

  const apiKey = generateApiKey();
  const apiKeyHash = await hashApiKey(apiKey);
  await deviceRepository.updateApiKeyHash(id, apiKeyHash);

  await auditLogRepository.log({
    actorId,
    action: 'DEVICE_KEY_ROTATED',
    entityType: 'Device',
    entityId: id,
  });

  return { apiKey };
}

/**
 * Called by the device itself (API-key authenticated, not a user). Only
 * promotes status to ONLINE from OFFLINE — a manual MAINTENANCE hold set by
 * an admin is not silently overridden by a heartbeat.
 */
async function recordHeartbeat(device, firmwareVersion) {
  const nextStatus = device.status === 'OFFLINE' ? 'ONLINE' : device.status;
  const updated = await deviceRepository.recordHeartbeat(device.id, { status: nextStatus, firmwareVersion });
  const pub = toPublicDevice(updated);
  eventBus.emit('device:telemetry', pub);
  return pub;
}

async function restartDevice(id, actor) {
  const device = await deviceRepository.findById(id);
  if (!device) throw new ApiError(404, 'Device not found');

  await auditLogRepository.log({
    actorId: actor?.id || null,
    action: 'DEVICE_RESTART_TRIGGERED',
    entityType: 'Device',
    entityId: id,
    metadata: { deviceCode: device.deviceCode },
  });

  eventBus.emit('device:command', { deviceCode: device.deviceCode, command: 'REBOOT' });
  return { success: true, message: `Reboot command sent to device ${device.deviceCode}` };
}

async function testBuzzer(id, actor) {
  const device = await deviceRepository.findById(id);
  if (!device) throw new ApiError(404, 'Device not found');

  await auditLogRepository.log({
    actorId: actor?.id || null,
    action: 'DEVICE_BUZZER_TEST_TRIGGERED',
    entityType: 'Device',
    entityId: id,
    metadata: { deviceCode: device.deviceCode },
  });

  eventBus.emit('device:command', { deviceCode: device.deviceCode, command: 'TEST_BUZZER' });
  return { success: true, message: `Buzzer test trigger sent to device ${device.deviceCode}` };
}

/**
 * Triggers an alert if a device went offline while an attendance session is currently open in its department/room.
 */
async function checkDeviceOfflineMidSession(device) {
  const sessionRepository = require('../repositories/attendanceSession.repository');
  const notificationService = require('./notification.service');
  
  const openSessions = await sessionRepository.findAllOpenForDepartment(device.departmentId);
  if (openSessions.length > 0) {
    const activeSession = openSessions[0];
    if (activeSession.facultyId) {
      await notificationService.notifyUser(
        activeSession.facultyId,
        'GENERAL',
        'Hardware Terminal Offline Warning',
        `IoT Terminal ${device.deviceCode} (${device.location || 'Lecture Hall'}) stopped sending telemetry during your active class session.`
      );
    }
  }
}

module.exports = {
  registerDevice,
  listDevices,
  getDevice,
  updateDevice,
  decommissionDevice,
  rotateApiKey,
  recordHeartbeat,
  restartDevice,
  testBuzzer,
  checkDeviceOfflineMidSession,
};
