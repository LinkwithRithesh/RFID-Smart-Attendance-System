const {
  calculateAttendanceMetrics,
  calculateConsecutiveStreak,
  calculateSafeMisses,
  calculateRequiredTo75,
} = require('../src/services/attendanceAnalytics.service');

describe('attendanceAnalytics', () => {
  describe('calculateAttendanceMetrics', () => {
    test('returns 100% and 0 held for empty attendance records', () => {
      const metrics = calculateAttendanceMetrics([]);
      expect(metrics.held).toBe(0);
      expect(metrics.attended).toBe(0);
      expect(metrics.percentage).toBe(100);
      expect(metrics.streak).toBe(0);
      expect(metrics.safeMisses).toBe(0);
      expect(metrics.requiredTo75).toBe(0);
    });

    test('counts PRESENT, LATE, and OD as attended', () => {
      const records = [
        { status: 'PRESENT', markedAt: new Date('2026-09-01T09:00:00Z') },
        { status: 'LATE', markedAt: new Date('2026-09-02T09:00:00Z') },
        { status: 'OD', markedAt: new Date('2026-09-03T09:00:00Z') },
        { status: 'ABSENT', markedAt: new Date('2026-09-04T09:00:00Z') },
      ];

      const metrics = calculateAttendanceMetrics(records);
      expect(metrics.held).toBe(4);
      expect(metrics.attended).toBe(3);
      expect(metrics.absent).toBe(1);
      expect(metrics.late).toBe(1);
      expect(metrics.od).toBe(1);
      expect(metrics.percentage).toBe(75);
    });
  });

  describe('streak computation', () => {
    test('calculates consecutive positive markings from latest backwards', () => {
      const records = [
        { status: 'ABSENT', markedAt: new Date('2026-09-01T09:00:00Z') },
        { status: 'PRESENT', markedAt: new Date('2026-09-02T09:00:00Z') },
        { status: 'LATE', markedAt: new Date('2026-09-03T09:00:00Z') },
        { status: 'OD', markedAt: new Date('2026-09-04T09:00:00Z') },
        { status: 'PRESENT', markedAt: new Date('2026-09-05T09:00:00Z') },
      ];

      expect(calculateConsecutiveStreak(records)).toBe(4);
    });

    test('returns 0 if latest record was ABSENT', () => {
      const records = [
        { status: 'PRESENT', markedAt: new Date('2026-09-01T09:00:00Z') },
        { status: 'ABSENT', markedAt: new Date('2026-09-02T09:00:00Z') },
      ];

      expect(calculateConsecutiveStreak(records)).toBe(0);
    });
  });

  describe('safe-misses formula', () => {
    test('calculates safe misses correctly when attendance is above 75%', () => {
      // 80 attended out of 80 held -> floor((80 - 0.75*80)/0.75) = floor((80 - 60)/0.75) = floor(20/0.75) = 26
      expect(calculateSafeMisses(80, 80)).toBe(26);

      // Check: after 26 misses: 80 / 106 = 75.47% (>= 75%)
      // If 27 misses: 80 / 107 = 74.76% (< 75%)
    });

    test('returns 0 when attendance is at or below 75%', () => {
      expect(calculateSafeMisses(15, 20)).toBe(0); // exactly 75%
      expect(calculateSafeMisses(14, 20)).toBe(0); // 70%
    });
  });

  describe('required-to-75 formula', () => {
    test('calculates required classes to recover to 75%', () => {
      // 10 attended out of 20 held (50%)
      // ceil((0.75 * 20 - 10) / 0.25) = ceil((15 - 10) / 0.25) = ceil(5 / 0.25) = 20
      // Check: after 20 attended: (10 + 20) / (20 + 20) = 30 / 40 = 75.0%
      expect(calculateRequiredTo75(10, 20)).toBe(20);
    });

    test('returns 0 if already at or above 75%', () => {
      expect(calculateRequiredTo75(15, 20)).toBe(0);
      expect(calculateRequiredTo75(18, 20)).toBe(0);
    });
  });
});
