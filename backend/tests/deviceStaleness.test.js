const {
  isDeviceOnline,
  computeSecondsSinceHeartbeat,
} = require('../src/utils/deviceOnlineStatus');

describe('deviceStaleness', () => {
  const THRESHOLD_SECONDS = 30;

  test('computes secondsSinceHeartbeat accurately against given now', () => {
    const now = new Date('2026-09-04T12:00:00Z');
    const lastHeartbeat = new Date('2026-09-04T11:59:45Z'); // 15 seconds ago

    const seconds = computeSecondsSinceHeartbeat(lastHeartbeat, now);
    expect(seconds).toBe(15);
  });

  test('reports ONLINE when last heartbeat is within 30 seconds', () => {
    const now = new Date('2026-09-04T12:00:00Z');
    const lastHeartbeat = new Date('2026-09-04T11:59:35Z'); // 25 seconds ago

    expect(isDeviceOnline(lastHeartbeat, now, THRESHOLD_SECONDS)).toBe(true);
  });

  test('reports OFFLINE when last heartbeat exceeds 30 seconds', () => {
    const now = new Date('2026-09-04T12:00:00Z');
    const lastHeartbeat = new Date('2026-09-04T11:59:28Z'); // 32 seconds ago

    expect(isDeviceOnline(lastHeartbeat, now, THRESHOLD_SECONDS)).toBe(false);
    expect(computeSecondsSinceHeartbeat(lastHeartbeat, now)).toBe(32);
  });

  test('handles null or invalid lastHeartbeat as OFFLINE', () => {
    expect(isDeviceOnline(null)).toBe(false);
    expect(computeSecondsSinceHeartbeat(null)).toBe(null);
  });
});
