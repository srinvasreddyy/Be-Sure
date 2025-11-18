const User = require('../models/User');
const sendEmail = require('../utils/emailService');
const Joi = require('joi');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
// Import all email templates
const { 
  getWelcomeOTPEmail, 
  getOTPTokenEmail,
  getPasswordResetEmail 
} = require('../utils/emailTemplates');
const validation = require('../utils/validationSchemas');

// Generate OTP Helper
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
};

// Helper to send JWT
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      isVerified: user.isVerified
    }
  });
};

// Helper function to generate and send Welcome/Verification OTP
const sendVerificationEmail = async (user) => {
  const otp = generateOTP();
  user.otp = {
    code: otp,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 mins
  };
  await user.save();

  try {
    const emailContent = getWelcomeOTPEmail(otp);
    await sendEmail({
      email: user.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    });
  } catch (emailErr) {
    logger.error('Email send failed during registration/resend', { 
      email: user.email, 
      error: emailErr, 
      stack: emailErr.stack 
    });
    // Re-throw for the controller to handle
    throw new AppError('Email could not be sent', 500);
  }
};

// Helper function to generate and send Password Reset OTP
const sendPasswordResetEmail = async (user) => {
  const otp = generateOTP();
  user.otp = {
    code: otp,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 mins (password reset)
  };
  await user.save();

  try {
    const emailContent = getPasswordResetEmail(otp);
    await sendEmail({
      email: user.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    });
  } catch (emailErr) {
    logger.error('Password reset email send failed', { 
      email: user.email, 
      error: emailErr, 
      stack: emailErr.stack 
    });
    // Re-throw for the controller to handle
    throw new AppError('Email could not be sent', 500);
  }
};


// @desc    Register user & Send OTP
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  // 1. Validate Input
  const { error } = validation.registerSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const { email, password } = req.body;

  // 2. Check if user exists
  let user = await User.findOne({ email });
  if (user) {
    // If user exists but is not verified, resend OTP
    if (!user.isVerified) {
      try {
        await sendVerificationEmail(user);
        return res.status(200).json({ 
          success: true, 
          data: 'User already exists. Verification email resent.' 
        });
      } catch (err) {
        return next(err); // Pass email error to global handler
      }
    }
    // If user exists AND is verified, it's an error
    return next(new AppError('User already exists', 400));
  }

  // 3. Create user (isVerified: false by default)
  user = await User.create({ email, password });

  // 4. Generate & Send OTP
  try {
    await sendVerificationEmail(user);
  } catch (emailErr) {
    // Log it, but the user was created.
    logger.error('Failed to send *initial* verification email.', {
      userId: user._id,
      error: emailErr,
      stack: emailErr.stack
    });
    // Don't fail the registration, just let them know. They can use "resend".
  }

  // 5. Return success message (NO TOKEN)
  res.status(201).json({
    success: true,
    data: 'User registered. Please check your email to verify your account.'
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const { error } = validation.loginSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Invalid credentials', 401));
  }

  // Check if user is verified
  if (!user.isVerified) {
    return next(new AppError('Account not verified. Please check your email.', 401));
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new AppError('Invalid credentials', 401));
  }

  // If all is good, send token
  sendTokenResponse(user, 200, res);
};

// @desc    Verify OTP & Get JWT
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res, next) => {
  // 1. Validate input
  const { error } = validation.verifyOTPSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const { email, code } = req.body;

  // 2. Find user
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('Invalid credentials', 400));
  }

  // 3. Check for OTP
  if (!user.otp || !user.otp.code) {
    return next(new AppError('No OTP requested', 400));
  }

  // 4. Check OTP code
  if (user.otp.code !== code) {
    return next(new AppError('Invalid OTP', 400));
  }

  // 5. Check OTP expiration
  if (user.otp.expiresAt < Date.now()) {
    return next(new AppError('OTP expired', 400));
  }

  // 6. Success: Update user
  user.isVerified = true;
  user.otp = undefined; // Clear OTP
  await user.save();

  // 7. Return JWT
  sendTokenResponse(user, 200, res);
};

// @desc    Resend Verification OTP
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res, next) => {
  // 1. Validate input
  const { error } = validation.resendVerificationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  
  const { email } = req.body;
  
  // 2. Find user
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists.
    logger.warn(`Verification resend requested for non-existent email: ${email}`);
    return res.status(200).json({ success: true, data: 'If your email is registered, a new verification code has been sent.' });
  }

  // 3. Check if already verified
  if (user.isVerified) {
    return next(new AppError('Account is already verified', 400));
  }

  // 4. Send new OTP
  await sendVerificationEmail(user); // This will throw and be caught by global handler

  res.status(200).json({ success: true, data: 'Verification email resent' });
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  // 1. Validate email
  const { error } = validation.forgotPasswordSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  
  const { email } = req.body;
  const user = await User.findOne({ email });

  // 2. Security: Always return success to prevent email enumeration.
  // Only proceed if user exists AND is verified.
  if (!user || !user.isVerified) {
    logger.warn(`Password reset requested for non-existent or unverified user: ${email}`);
    return res.status(200).json({ 
      success: true, 
      data: 'If your account is verified, a password reset email has been sent.' 
    });
  }

  // 3. Send password reset email
  try {
    await sendPasswordResetEmail(user);
    res.status(200).json({ 
      success: true, 
      data: 'If your account is verified, a password reset email has been sent.' 
    });
  } catch (err) {
    // If email sending fails, pass to global error handler
    return next(err);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  // 1. Validate body
  const { error } = validation.resetPasswordSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const { email, code, newPassword } = req.body;

  // 2. Find user
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('Invalid request', 400));
  }
  
  // 3. Check for OTP, code, and expiration
  if (!user.otp || !user.otp.code || user.otp.code !== code || user.otp.expiresAt < Date.now()) {
    return next(new AppError('Invalid or expired OTP', 400));
  }
  
  // 4. All checks passed. Update password.
  user.password = newPassword; // The 'save' hook in User.js will hash it
  user.otp = undefined; // Clear the OTP
  await user.save();

  // 5. Send new token (log them in)
  sendTokenResponse(user, 200, res);
};