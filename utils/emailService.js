const nodemailer = require('nodemailer');

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
    text: options.message,
    html: options.html // Optional HTML version
  };

  const info = await transporter.sendMail(message);
  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;