const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Creates a reusable Nodemailer transport object using Gmail.
 * * Configuration notes:
 * 1. service: 'gmail' - As requested.
 * 2. family: 4 - Forces IPv4. This is CRITICAL for fixing the "Connection timeout" on Render.
 * 3. rejectUnauthorized: false - Allows sending without strict SSL checks.
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  family: 4, // Fixes Connection Timeout on cloud servers (forces IPv4)
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // "Without security also no problem"
  }
});

const sendEmail = async (options) => {
  const message = {
    from: `"Be-Sure Insurance" <${process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.text,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(message);
    logger.info(`Email sent successfully to ${options.email}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Email Service Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      target: options.email
    });
    
    // Re-throw to ensure the controller handles the failure
    throw error;
  }
};

module.exports = sendEmail;