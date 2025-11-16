const axios = require('axios');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// @desc    Step 1: Fetch Vehicle Data (from DB or DVLA)
// @route   POST /api/vehicle/lookup
// @access  Private
exports.lookupVehicle = async (req, res, next) => {
  let { vrm } = req.body;

  if (!vrm) {
    return next(new AppError('Please provide a Licence Plate Number (VRM)', 400));
  }

  vrm = vrm.replace(/\s/g, '').toUpperCase();

  // 1. Check if we already have this vehicle saved with full details
  const existingVehicle = await Vehicle.findOne({ vrm });

  if (existingVehicle) {
    return res.status(200).json({
      success: true,
      source: 'database', // Inform frontend data came from DB
      data: existingVehicle
    });
  }

  // 2. If not in DB, fetch from DVLA VES API
  const apiKey = process.env.DVLA_API_KEY;
  const apiUrl = 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';

  try {
    const response = await axios.post(
      apiUrl,
      { registrationNumber: vrm },
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    const apiData = response.data;

    // Map DVLA response to our Schema structure
    // We do NOT save here. We send this to frontend to pre-fill the form.
    const vehicleData = {
      vrm: apiData.registrationNumber,
      manufacturer: apiData.make,
      model: '', // DVLA does not provide model, user must fill this
      automatedVehicle: apiData.automatedVehicle || false,
      co2Emissions: apiData.co2Emissions || 0,
      fuelType: apiData.fuelType,
      engineCapacity: apiData.engineCapacity,
      yearOfManufacture: apiData.yearOfManufacture,
      colour: apiData.colour
    };

    res.status(200).json({
      success: true,
      source: 'dvla_api', // Inform frontend data came from API (needs 'model' input)
      data: vehicleData
    });

  } catch (apiError) {
    console.error('DVLA API Error:', apiError.message);
    
    if (apiError.response && apiError.response.status === 404) {
        return next(new AppError('Vehicle not found in DVLA database', 404));
    }
    if (apiError.response && apiError.response.status === 403) {
         return next(new AppError('DVLA API Limit reached or Invalid Key', 403));
    }

    return next(new AppError('External Vehicle API unavailable', 502));
  }
};

// @desc    Step 2: Save Complete Vehicle Data
// @route   POST /api/vehicle/save
// @access  Private
exports.saveVehicle = async (req, res, next) => {
  const { 
    vrm, manufacturer, model, automatedVehicle, 
    co2Emissions, fuelType, engineCapacity, 
    yearOfManufacture, colour 
  } = req.body;

  // 1. Upsert Vehicle (Create if new, Update if exists)
  // We run validators to ensure 'model' and other required fields are present
  const vehicle = await Vehicle.findOneAndUpdate(
    { vrm },
    {
      vrm, manufacturer, model, automatedVehicle,
      co2Emissions, fuelType, engineCapacity,
      yearOfManufacture, colour,
      lastSearchedAt: Date.now()
    },
    { new: true, upsert: true, runValidators: true }
  );

  // 2. Link to User History
  await User.findByIdAndUpdate(req.user.id, {
    $addToSet: { searchedVehicles: vehicle._id }
  });

  res.status(201).json({
    success: true,
    data: vehicle
  });
};

// @desc    Get User's Search History
// @route   GET /api/vehicle/history
// @access  Private
exports.getHistory = async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('searchedVehicles');
  
  res.status(200).json({
    success: true,
    count: user.searchedVehicles.length,
    data: user.searchedVehicles
  });
};