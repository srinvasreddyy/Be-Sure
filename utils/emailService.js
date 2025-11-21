const nodemailer = require('nodemailer');
const logger = require('./logger'); // Import logger

const sendEmail = async (options) => {
  // Create transporter using explicit SMTP settings for stability
  // Port 465 (SSL) is generally more reliable in production environments than 587
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
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

  try {
    const info = await transporter.sendMail(message);
    // Log success with message ID for tracking
    logger.info(`Email sent successfully: ${info.messageId}`, { 
      to: options.email, 
      subject: options.subject 
    });
  } catch (error) {
    // Log the FULL error details immediately for easier debugging
    logger.error('Nodemailer System Error:', { 
      message: error.message,
      code: error.code,
      response: error.response,
      stack: error.stack,
      target: options.email
    });
    
    // Re-throw the error so the authController knows it failed
    throw error;
  }
};

module.exports = sendEmail;