const nodemailer = require('nodemailer');
const logger = require('./logger');

const sendEmail = async (options) => {
  // Using the 'gmail' service shorthand as requested.
  // This automatically handles host/port settings for Google.
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL, // Your Gmail address
      pass: process.env.SMTP_PASSWORD // Your 16-char Google App Password
    }
  });

  const message = {
    from: `${process.env.SMTP_EMAIL} <noreply@ukinsurance.co.uk>`,
    to: options.email,
    subject: options.subject,
    text: options.text,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(message);
    logger.info(`Email sent successfully: ${info.messageId}`, {
      to: options.email,
      subject: options.subject
    });
  } catch (error) {
    // Enhanced logging to find the specific cause of the error (e.g., ETIMEDOUT, EAUTH)
    logger.error('Email Service Error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      stack: error.stack,
      target: options.email
    });
    
    // Re-throw to ensure the controller knows the email failed
    throw error;
  }
};

module.exports = sendEmail;