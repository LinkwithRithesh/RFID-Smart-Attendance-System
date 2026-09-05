const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');

/**
 * Starts a real local SMTP server for tests to send actual email through,
 * instead of mocking nodemailer. Returns { port, receivedEmails, close }.
 */
function startTestSmtpServer() {
  const receivedEmails = [];

  const server = new SMTPServer({
    authOptional: true,
    disabledCommands: ['STARTTLS', 'AUTH'],
    onData(stream, session, callback) {
      simpleParser(stream, {}, (err, parsed) => {
        if (err) return callback(err);
        receivedEmails.push({
          to: parsed.to.text,
          from: parsed.from.text,
          subject: parsed.subject,
          text: (parsed.text || '').trim(),
        });
        callback();
      });
    },
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.server.address().port;
      resolve({
        port,
        receivedEmails,
        close: () => new Promise((res) => server.close(res)),
      });
    });
  });
}

module.exports = { startTestSmtpServer };
