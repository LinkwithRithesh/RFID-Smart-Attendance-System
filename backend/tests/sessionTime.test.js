const { combineDateAndTime, computeAttendanceStatus, toTimeOfDay } = require('../src/utils/sessionTime');

describe('toTimeOfDay', () => {
  test('anchors the wall-clock time to 1970-01-01, matching Prisma TIME representation', () => {
    const now = new Date('2026-07-29T09:05:30');
    const result = toTimeOfDay(now);
    expect(result.getUTCFullYear()).toBe(1970);
    expect(result.getUTCMonth()).toBe(0);
    expect(result.getUTCDate()).toBe(1);
    expect(result.getUTCHours()).toBe(now.getHours());
    expect(result.getUTCMinutes()).toBe(now.getMinutes());
  });
});


describe('combineDateAndTime', () => {
  test('applies the time-of-day onto the session date', () => {
    const date = new Date('2026-07-29T00:00:00Z');
    const time = new Date('1970-01-01T09:30:00Z'); // Prisma's representation of TIME '09:30:00'
    const combined = combineDateAndTime(date, time);
    expect(combined.getUTCFullYear()).toBe(2026);
    expect(combined.getUTCMonth()).toBe(6); // July = 6
    expect(combined.getUTCDate()).toBe(29);
    expect(combined.getUTCHours()).toBe(9);
    expect(combined.getUTCMinutes()).toBe(30);
  });
});

describe('computeAttendanceStatus', () => {
  const session = {
    sessionDate: new Date('2026-07-29T00:00:00Z'),
    startTime: new Date('1970-01-01T09:00:00Z'), // class starts 09:00
  };

  function atLocalTime(h, m) {
    const d = new Date(session.sessionDate);
    d.setUTCHours(h, m, 0, 0);
    return d;
  }

  test('marked before start time is PRESENT', () => {
    expect(computeAttendanceStatus(session, atLocalTime(8, 55))).toBe('PRESENT');
  });

  test('marked exactly at start time is PRESENT', () => {
    expect(computeAttendanceStatus(session, atLocalTime(9, 0))).toBe('PRESENT');
  });

  test('marked within the default 10-minute grace window is PRESENT', () => {
    expect(computeAttendanceStatus(session, atLocalTime(9, 10))).toBe('PRESENT');
  });

  test('marked just after the grace window is LATE', () => {
    expect(computeAttendanceStatus(session, atLocalTime(9, 11))).toBe('LATE');
  });

  test('marked well after start is LATE', () => {
    expect(computeAttendanceStatus(session, atLocalTime(9, 45))).toBe('LATE');
  });

  test('respects a custom late threshold', () => {
    expect(computeAttendanceStatus(session, atLocalTime(9, 20), 30)).toBe('PRESENT');
    expect(computeAttendanceStatus(session, atLocalTime(9, 31), 30)).toBe('LATE');
  });
});
