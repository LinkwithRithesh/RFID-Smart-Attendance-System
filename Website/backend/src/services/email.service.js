const { createTransporter } = require('../config/mailer');

async function sendEmail({ to, subject, text }) {
  const transporter = createTransporter();
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
    });
    return { delivered: true };
  } catch (err) {
    return { delivered: false, reason: err.message };
  }
}

module.exports = { sendEmail };
