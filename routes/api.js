const express = require('express');
const router = express.Router();
const { register, login, sendOTP, verifyOTP } = require('../controllers/authController');
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

// --- Auth Routes ---
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/send-otp', protect, sendOTP);
router.post('/auth/verify-otp', protect, verifyOTP);

// --- Vehicle Routes ---
router.post('/vehicle/search', protect, lookupVehicle);
router.get('/vehicle/history', protect, getHistory);

// --- Quote Routes (New) ---
// All quote routes are protected
router.post('/quote/start', protect, createQuote);
router.get('/quote/:quoteId', protect, getQuote);
router.post('/quote/:quoteId/vehicle-info', protect, updateVehicleInfo);
router.post('/quote/:quoteId/driver-info', protect, updateDriverInfo);
router.post('/quote/:quoteId/license-info', protect, updateLicenseInfo);
router.post('/quote/:quoteId/history-info', protect, updateHistoryInfo);
router.post('/quote/:quoteId/usage-info', protect, updateUsageInfo);
router.post('/quote/:quoteId/payment-info', protect, updatePaymentInfo);


module.exports = router;