const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Configured for Gmail SMTP.
 * NOTE: Render Free Tier blocks ports 25, 465, and 587.
 * If this times out, you must upgrade your Render plan or use an API-based service like SendGrid.
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Explicitly set Gmail host
  port: 587,              // Use 587 (STARTTLS) - standard for submission
  secure: false,          // Must be false for port 587 (true is for 465)
  family: 4,              // Forces IPv4 (Fixes generic Node timeout issues)
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false // Helps avoid some self-signed cert errors in dev
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
    
    // Re-throw so the controller knows it failed
    throw error;
  }
};

module.exports = sendEmail;