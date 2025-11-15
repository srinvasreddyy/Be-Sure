const express = require('express');
const router = express.Router();
const { register, login, sendOTP, verifyOTP } = require('../controllers/authController');
const { searchVehicle, getHistory } = require('../controllers/vehicleController');
const { protect } = require('../middleware/auth');

// Auth Routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/send-otp', protect, sendOTP);
router.post('/auth/verify-otp', protect, verifyOTP);

// Vehicle Routes
router.post('/vehicle/search', protect, searchVehicle);
router.get('/vehicle/history', protect, getHistory);

module.exports = router;