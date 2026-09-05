const { outranks, rankOf } = require('../src/utils/overrideRank');

describe('overrideRank', () => {
  test('follows the exact spec hierarchy: Emergency > Dean > Admin > HOD > Automatic', () => {
    expect(rankOf('EMERGENCY')).toBeGreaterThan(rankOf('DEAN'));
    expect(rankOf('DEAN')).toBeGreaterThan(rankOf('ADMIN'));
    expect(rankOf('ADMIN')).toBeGreaterThan(rankOf('HOD'));
    expect(rankOf('HOD')).toBeGreaterThan(rankOf('NONE'));
  });

  test('EMERGENCY outranks everything', () => {
    expect(outranks('EMERGENCY', 'DEAN')).toBe(true);
    expect(outranks('EMERGENCY', 'ADMIN')).toBe(true);
    expect(outranks('EMERGENCY', 'HOD')).toBe(true);
    expect(outranks('EMERGENCY', 'NONE')).toBe(true);
  });

  test('HOD cannot override a DEAN or ADMIN session', () => {
    expect(outranks('HOD', 'DEAN')).toBe(false);
    expect(outranks('HOD', 'ADMIN')).toBe(false);
  });

  test('any manual override outranks an automatic (NONE) timetable session', () => {
    expect(outranks('HOD', 'NONE')).toBe(true);
  });

  test('equal rank never outranks — same-level cannot silently clobber same-level', () => {
    expect(outranks('HOD', 'HOD')).toBe(false);
    expect(outranks('DEAN', 'DEAN')).toBe(false);
    expect(outranks('NONE', 'NONE')).toBe(false);
  });
});
