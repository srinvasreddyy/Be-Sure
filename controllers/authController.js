const User = require('../models/User');
const sendEmail = require('../utils/emailService');
const Joi = require('joi');

// Generate OTP Helper
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required()
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const { email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Create user
    user = await User.create({ email, password });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
// @access  Private (Protected by JWT) or Public if strictly OTP flow
exports.sendOTP = async (req, res) => {
  try {
    // We assume user is already logged in or providing email. 
    // Since requirement says "login with gmail otp", we can do this for authenticated users.
    // Or if it's a passwordless flow, we'd do it differently. 
    // Here we assume authenticated user requesting verification.
    
    const user = await User.findById(req.user.id);
    const otp = generateOTP();
    
    // Set OTP and expiry (10 mins)
    user.otp = {
      code: otp,
      expiresAt: Date.now() + 10 * 60 * 1000
    };
    await user.save();

    // Send Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Your UK Insurance Login OTP',
        message: `Your OTP code is: ${otp}. It expires in 10 minutes.`
      });
      res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
      console.error(err);
      user.otp = undefined;
      await user.save();
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