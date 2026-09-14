const { sendPush } = require('../src/services/pushProvider');

describe('pushProvider (stub — no FCM/APNs credentials in scope)', () => {
  test('always reports delivered: false with a clear reason, never fakes success', async () => {
    const result = await sendPush({ id: 1 }, 'Title', 'Message');
    expect(result.delivered).toBe(false);
    expect(result.reason).toMatch(/not configured/i);
  });
});
