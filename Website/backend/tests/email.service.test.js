const { startTestSmtpServer } = require('./support/testSmtpServer');

describe('email.service (real SMTP integration)', () => {
  let smtpServer;

  beforeAll(async () => {
    smtpServer = await startTestSmtpServer();
    process.env.SMTP_HOST = '127.0.0.1';
    process.env.SMTP_PORT = String(smtpServer.port);
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_FROM = 'Smart Campus Attendance <no-reply@campus.edu>';
  });

  afterAll(async () => {
    await smtpServer.close();
  });

  test('actually sends an email and the server receives the exact content', async () => {
    // required after env vars are set, since createTransporter reads them at call time
    const { sendEmail } = require('../src/services/email.service');

    const result = await sendEmail({
      to: 'alice@campus.edu',
      subject: 'Attendance Marked',
      text: 'Your attendance was marked as PRESENT at 2026-07-30T09:05:00.000Z.',
    });

    expect(result.delivered).toBe(true);
    expect(smtpServer.receivedEmails).toHaveLength(1);
    expect(smtpServer.receivedEmails[0]).toMatchObject({
      to: 'alice@campus.edu',
      subject: 'Attendance Marked',
      text: 'Your attendance was marked as PRESENT at 2026-07-30T09:05:00.000Z.',
    });
    expect(smtpServer.receivedEmails[0].from).toContain('no-reply@campus.edu');
  });

  test('reports delivered: false with a reason when the SMTP server is unreachable', async () => {
    process.env.SMTP_PORT = '1'; // nothing listens on port 1
    const { sendEmail } = require('../src/services/email.service');

    const result = await sendEmail({ to: 'x@campus.edu', subject: 'x', text: 'x' });

    expect(result.delivered).toBe(false);
    expect(result.reason).toEqual(expect.any(String));

    process.env.SMTP_PORT = String(smtpServer.port); // restore for other tests
  });
});
