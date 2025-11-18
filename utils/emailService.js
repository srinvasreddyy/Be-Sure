const nodemailer = require('nodemailer');
const logger = require('./logger'); // Import logger

const sendEmail = async (options) => {
  // Create transporter using Gmail Service
  // Note: For Gmail, you might need to enable "App Passwords" if 2FA is on.
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const message = {
    from: `${process.env.SMTP_EMAIL} <noreply@ukinsurance.co.uk>`,
    to: options.email,
    subject: options.subject,
    text: options.text,
    html: options.html // Optional HTML version
  };

  const info = await transporter.sendMail(message);
  // Use logger.info, not console.log
  logger.info(`Email sent: ${info.messageId}`, { to: options.email, subject: options.subject });
};

module.exports = sendEmail;