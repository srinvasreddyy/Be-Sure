const User = require('../models/User');
const sendEmail = require('../utils/emailService');
const Joi = require('joi');

// Generate OTP Helper
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
};

// @desc    Register user & Send OTP
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    // 1. Validate Input
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required()
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const { email, password } = req.body;

    // 2. Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, error: 'User already exists' });
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
      console.error('Email send failed:', emailErr);
      // We still return the token, but frontend should warn user to resend OTP
    }

    // 5. Return Token so they are "logged in" but not verified
    sendTokenResponse(user, 201, res);

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Send OTP for Login/Verification
// @route   POST /api/auth/send-otp
// @access  Private
exports.sendOTP = async (req, res) => {
  try {
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
      console.error(err);
      return res.status(500).json({ success: false, error: 'Email could not be sent' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Private
exports.verifyOTP = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.otp || !user.otp.code) {
      return res.status(400).json({ success: false, error: 'No OTP requested' });
    }

    if (user.otp.code !== code) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    if (user.otp.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, error: 'OTP expired' });
    }

    // Success
    user.isVerified = true;
    user.otp = undefined; // Clear OTP
    await user.save();

    res.status(200).json({ success: true, data: 'Account verified' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
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