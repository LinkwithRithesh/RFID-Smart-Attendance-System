const { computeIsOnline, HEARTBEAT_THRESHOLD_SECONDS } = require('../src/utils/deviceOnlineStatus');

const NOW = new Date('2026-07-29T12:00:00Z');

function secondsAgo(seconds) {
  return new Date(NOW.getTime() - seconds * 1000);
}

describe('computeIsOnline', () => {
  test('online when status is ONLINE and heartbeat is recent', () => {
    const device = { status: 'ONLINE', lastHeartbeatAt: secondsAgo(10) };
    expect(computeIsOnline(device, NOW)).toBe(true);
  });

  test('offline when heartbeat is older than the threshold', () => {
    const device = { status: 'ONLINE', lastHeartbeatAt: secondsAgo(HEARTBEAT_THRESHOLD_SECONDS + 1) };
    expect(computeIsOnline(device, NOW)).toBe(false);
  });

  test('exactly at the threshold boundary counts as online', () => {
    const device = { status: 'ONLINE', lastHeartbeatAt: secondsAgo(HEARTBEAT_THRESHOLD_SECONDS) };
    expect(computeIsOnline(device, NOW)).toBe(true);
  });

  test('never online with no heartbeat recorded at all', () => {
    const device = { status: 'ONLINE', lastHeartbeatAt: null };
    expect(computeIsOnline(device, NOW)).toBe(false);
  });

  test('MAINTENANCE always reports offline regardless of heartbeat recency', () => {
    const device = { status: 'MAINTENANCE', lastHeartbeatAt: secondsAgo(1) };
    expect(computeIsOnline(device, NOW)).toBe(false);
  });

  test('DECOMMISSIONED always reports offline regardless of heartbeat recency', () => {
    const device = { status: 'DECOMMISSIONED', lastHeartbeatAt: secondsAgo(1) };
    expect(computeIsOnline(device, NOW)).toBe(false);
  });

  test('OFFLINE status with a stale heartbeat reports offline', () => {
    const device = { status: 'OFFLINE', lastHeartbeatAt: secondsAgo(9999) };
    expect(computeIsOnline(device, NOW)).toBe(false);
  });
});
