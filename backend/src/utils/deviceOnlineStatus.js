// "Status" (ONLINE/OFFLINE/MAINTENANCE/DECOMMISSIONED) is admin-controlled
// lifecycle state. "isOnline" is a derived, live signal based on whether a
// heartbeat has arrived recently — kept separate so we don't need a
// background cron job just to flip a stored flag back to OFFLINE.
// Heartbeat threshold: 30 seconds as specified in the frontend contract.
const HEARTBEAT_THRESHOLD_SECONDS = 30;

function computeSecondsSinceHeartbeat(deviceOrDate, now = new Date()) {
  if (!deviceOrDate) return null;
  const heartbeatDate = deviceOrDate instanceof Date ? deviceOrDate : (deviceOrDate.lastHeartbeatAt ? new Date(deviceOrDate.lastHeartbeatAt) : null);
  if (!heartbeatDate || isNaN(heartbeatDate.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - heartbeatDate.getTime()) / 1000));
}

function computeIsOnline(deviceOrDate, now = new Date(), threshold = HEARTBEAT_THRESHOLD_SECONDS) {
  if (!deviceOrDate) return false;
  if (deviceOrDate.status === 'MAINTENANCE' || deviceOrDate.status === 'DECOMMISSIONED') {
    return false;
  }
  const seconds = computeSecondsSinceHeartbeat(deviceOrDate, now);
  return seconds !== null && seconds <= threshold;
}

const isDeviceOnline = computeIsOnline;

module.exports = {
  computeIsOnline,
  isDeviceOnline,
  computeSecondsSinceHeartbeat,
  HEARTBEAT_THRESHOLD_SECONDS,
};
