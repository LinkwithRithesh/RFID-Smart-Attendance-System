const { dayOfWeekFor } = require('../src/utils/dayOfWeek');

describe('dayOfWeekFor', () => {
  test('maps known dates to the correct enum value', () => {
    expect(dayOfWeekFor(new Date('2026-07-27T12:00:00Z'))).toBe('MON'); // Jul 27 2026 is a Monday
    expect(dayOfWeekFor(new Date('2026-08-02T12:00:00Z'))).toBe('SUN');
  });
});
