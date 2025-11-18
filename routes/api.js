const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit'); // Import rate-limit
const { 
  register, 
  login, 
  verifyOTP,
  resendVerification,
  forgotPassword, // Added
  resetPassword   // Added
} = require('../controllers/authController');
const { lookupVehicle, getHistory } = require('../controllers/vehicleController');
const { protect } = require('../middleware/auth');
const {
  createQuote,
  getQuote,
  updateVehicleInfo,
  updateDriverInfo,
  updateLicenseInfo,
  updateHistoryInfo,
  updateUsageInfo,
  updatePaymentInfo
} = require('../controllers/quoteController');

// --- Stricter Rate Limiter for Auth Routes ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per window (per 15 minutes)
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// --- Auth Routes (Now with authLimiter) ---
router.post('/auth/register', authLimiter, register);
router.post('/auth/login', authLimiter, login);
router.post('/auth/verify-otp', authLimiter, verifyOTP);
router.post('/auth/resend-verification', authLimiter, resendVerification);
router.post('/auth/forgot-password', authLimiter, forgotPassword); // New public route
router.post('/auth/reset-password', authLimiter, resetPassword);   // New public route

// --- Vehicle Routes ---
// These routes are protected by the global limiter in server.js
router.post('/vehicle/search', protect, lookupVehicle);
router.get('/vehicle/history', protect, getHistory);

// --- Quote Routes (New) ---
// These routes are protected by the global limiter in server.js
router.post('/quote/start', protect, createQuote);
router.get('/quote/:quoteId', protect, getQuote);
router.post('/quote/:quoteId/vehicle-info', protect, updateVehicleInfo);
router.post('/quote/:quoteId/driver-info', protect, updateDriverInfo);
router.post('/quote/:quoteId/license-info', protect, updateLicenseInfo);
router.post('/quote/:quoteId/history-info', protect, updateHistoryInfo);
router.post('/quote/:quoteId/usage-info', protect, updateUsageInfo);
router.post('/quote/:quoteId/payment-info', protect, updatePaymentInfo);


module.exports = router;