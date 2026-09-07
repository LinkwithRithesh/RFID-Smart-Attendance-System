const compressible = require('compressible');

describe('compression MIME filtering', () => {
  test('JSON API responses are compressed', () => {
    expect(compressible('application/json')).toBe(true);
  });

  test('PDF report downloads are NOT re-compressed (already dense binary)', () => {
    expect(compressible('application/pdf')).toBe(false);
  });

  test('xlsx report downloads are NOT re-compressed (already a zip archive)', () => {
    expect(compressible('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(false);
  });
});
