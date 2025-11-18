// This file contains HTML templates for emails.
// We use inline CSS for maximum compatibility with email clients.

const brandColor = '#004a99'; // A professional blue
const brandLogoUrl = 'https_request_failure'; // Placeholder - replace with a real logo URL if available
const companyName = 'Be-Sure Insurance';

/**
 * Creates the base HTML structure for all emails.
 * @param {string} preheader - A short summary text that follows the subject line.
 * @param {string} contentHtml - The main body of the email (as HTML).
 * @returns {string} The full HTML email document.
 */
const getBaseTemplate = (preheader, contentHtml) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${preheader}</title>
    <style>
      body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
      .container { width: 100%; max-width: 600px; margin: 0 auto; }
      .header { background-color: ${brandColor}; padding: 20px; text-align: center; }
      .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
      .content { padding: 40px 30px; background-color: #f4f4f4; }
      .card { background-color: #ffffff; border-radius: 8px; padding: 30px; }
      .card h2 { color: #333333; margin-top: 0; font-size: 20px; }
      .card p { color: #555555; font-size: 16px; line-height: 1.5; }
      .otp-code {
        font-size: 36px;
        font-weight: bold;
        color: ${brandColor};
        letter-spacing: 4px;
        margin: 25px 0;
        text-align: center;
      }
      .footer { background-color: #333333; padding: 20px; text-align: center; }
      .footer p { color: #aaaaaa; margin: 0; font-size: 12px; }
    </style>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
    <span style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
      ${preheader}
    </span>
    
    <table class="container" role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto;">
      <tr>
        <td class="header" style="background-color: ${brandColor}; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${companyName}</h1>
        </td>
      </tr>
      
      <tr>
        <td class="content" style="padding: 40px 30px; background-color: #f4f4f4;">
          <table class="card" role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #ffffff; border-radius: 8px; padding: 30px;">
            <tr>
              <td>
                ${contentHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <tr>
        <td class="footer" style="background-color: #333333; padding: 20px; text-align: center;">
          <p style="color: #aaaaaa; margin: 0; font-size: 12px;">
            © ${new Date().getFullYear()} ${companyName}. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

/**
 * Template for the Welcome & Registration OTP
 * @param {string} otp - The 6-digit OTP code
 * @returns {object} { subject, text, html }
 */
exports.getWelcomeOTPEmail = (otp) => {
  const preheader = `Your ${companyName} verification code is ${otp}`;
  const subject = `Welcome to ${companyName}! Verify your account.`;

  const text = `
    Welcome to ${companyName}!
    
    Your verification code is: ${otp}
    
    This code will expire in 10 minutes.
  `;

  const contentHtml = `
    <h2 style="color: #333333; margin-top: 0; font-size: 20px;">Welcome to ${companyName}!</h2>
    <p style="color: #555555; font-size: 16px; line-height: 1.5;">
      Thanks for signing up. Please use the code below to verify your email address and complete your registration.
    </p>
    
    <div class="otp-code" style="font-size: 36px; font-weight: bold; color: ${brandColor}; letter-spacing: 4px; margin: 25px 0; text-align: center;">
      ${otp}
    </div>
    
    <p style="color: #555555; font-size: 16px; line-height: 1.5;">
      This code will expire in 10 minutes. If you did not request this, please disregard this email.
    </p>
  `;

  return {
    subject,
    text,
    html: getBaseTemplate(preheader, contentHtml)
  };
};

/**
 * Template for a standard OTP request (e.g., resend)
 * @param {string} otp - The 6-digit OTP code
 * @returns {object} { subject, text, html }
 */
exports.getOTPTokenEmail = (otp) => {
  const preheader = `Your ${companyName} OTP code is ${otp}`;
  const subject = `Your ${companyName} OTP Code`;

  const text = `
    Your OTP code is: ${otp}
    
    This code will expire in 10 minutes.
  `;

  const contentHtml = `
    <h2 style="color: #333333; margin-top: 0; font-size: 20px;">Your One-Time Passcode</h2>
    <p style="color: #555555; font-size: 16px; line-height: 1.5;">
      Please use the code below to complete your request.
    </p>
    
    <div class="otp-code" style="font-size: 36px; font-weight: bold; color: ${brandColor}; letter-spacing: 4px; margin: 25px 0; text-align: center;">
      ${otp}
    </div>
    
    <p style="color: #555555; font-size: 16px; line-height: 1.5;">
      This code will expire in 10 minutes. If you did not request this, please disregard this email.
    </p>
  `;

  return {
    subject,
    text,
    html: getBaseTemplate(preheader, contentHtml)
  };
};

/**
 * Template for Password Reset OTP (NEW)
 * @param {string} otp - The 6-digit OTP code
 * @returns {object} { subject, text, html }
 */
exports.getPasswordResetEmail = (otp) => {
  const preheader = `Your password reset code is ${otp}`;
  const subject = `Your ${companyName} Password Reset Request`;

  const text = `
    You requested a password reset for your ${companyName} account.
    
    Your reset code is: ${otp}
    
    This code will expire in 10 minutes. If you did not request this, please ignore this email.
  `;

  const contentHtml = `
    <h2 style="color: #333333; margin-top: 0; font-size: 20px;">Password Reset Request</h2>
    <p style="color: #555555; font-size: 16px; line-height: 1.5;">
      We received a request to reset the password for your account. Use the code below to set up a new password.
    </p>
    
    <div class="otp-code" style="font-size: 36px; font-weight: bold; color: ${brandColor}; letter-spacing: 4px; margin: 25px 0; text-align: center;">
      ${otp}
    </div>
    
    <p style="color: #555555; font-size: 16px; line-height: 1.5;">
      This code will expire in 10 minutes. If you did not request this, please disregard this email.
    </p>
  `;

  return {
    subject,
    text,
    html: getBaseTemplate(preheader, contentHtml)
  };
};