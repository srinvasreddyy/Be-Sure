const User = require('../models/User');
const sendEmail = require('../utils/emailService');
const Joi = require('joi');
const AppError = require('../utils/AppError');

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

// @desc    Register user & Send OTP
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  // 1. Validate Input
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const { email, password } = req.body;

  // 2. Check if user exists
  let user = await User.findOne({ email });
  if (user) {
    return next(new AppError('User already exists', 400));
  }

  // 3. Create user (isVerified: false by default)
  user = await User.create({ email, password });

  // 4. Generate & Send OTP immediately
  const otp = generateOTP();
  user.otp = {
    code: otp,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 mins
  };
  await user.save();

  try {
    await sendEmail({
      email: user.email,
      subject: 'Verify your UK Insurance Account',
      message: `Welcome! Your verification code is: ${otp}. It expires in 10 minutes.`
    });
  } catch (emailErr) {
    // We log this but don't fail the registration, just let frontend know to resend
    // Or we can treat it as a failure. For now, using console.error via logger indirectly or just letting it pass.
    console.error('Email send failed:', emailErr);
  }

  // 5. Return Token
  sendTokenResponse(user, 201, res);
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Invalid credentials', 401));
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new AppError('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
};

// @desc    Send OTP for Login/Verification
// @route   POST /api/auth/send-otp
// @access  Private
exports.sendOTP = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const otp = generateOTP();
  
  user.otp = {
    code: otp,
    expiresAt: Date.now() + 10 * 60 * 1000
  };
  await user.save();

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your OTP Code',
      message: `Your OTP code is: ${otp}`
    });
    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    return next(new AppError('Email could not be sent', 500));
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Private
exports.verifyOTP = async (req, res, next) => {
  const { code } = req.body;
  const user = await User.findById(req.user.id);

  if (!user.otp || !user.otp.code) {
    return next(new AppError('No OTP requested', 400));
  }

  if (user.otp.code !== code) {
    return next(new AppError('Invalid OTP', 400));
  }

  if (user.otp.expiresAt < Date.now()) {
    return next(new AppError('OTP expired', 400));
  }

  // Success
  user.isVerified = true;
  user.otp = undefined; // Clear OTP
  await user.save();

  res.status(200).json({ success: true, data: 'Account verified' });
};