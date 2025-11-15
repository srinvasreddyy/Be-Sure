const axios = require('axios');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// @desc    Search Vehicle by VRM
// @route   POST /api/vehicle/search
// @access  Private
exports.searchVehicle = async (req, res, next) => {
  let { vrm } = req.body;
  
  if (!vrm) {
    return next(new AppError('Please provide a Licence Plate Number (VRM)', 400));
  }

  // Sanitize VRM (Remove spaces, uppercase)
  vrm = vrm.replace(/\s/g, '').toUpperCase();

  // 1. Check DB Cache first
  let vehicle = await Vehicle.findOne({ vrm });

  if (!vehicle) {
    // 2. Fetch from API if not in DB
    const apiKey = process.env.UK_VEHICLE_API_KEY;
    const packageType = process.env.UK_VEHICLE_PACKAGE || 'VehicleData';
    
    const apiUrl = `https://ukvehicledata.co.uk/api/datapackage/${packageType}?v=2&api_nullitems=1&auth_apikey=${apiKey}&key_VRM=${vrm}`;

    try {
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data && data.Response && data.Response.StatusCode === 'Success') {
          const apiData = data.Response.DataItems;
          
          const vehicleData = {
            vrm: vrm,
            make: apiData.VehicleRegistration?.Make || 'Unknown',
            model: apiData.VehicleRegistration?.Model || 'Unknown',
            color: apiData.VehicleRegistration?.Colour || 'Unknown',
            yearOfManufacture: apiData.VehicleRegistration?.YearOfManufacture,
            engineCapacity: apiData.VehicleRegistration?.EngineCapacity,
            fuelType: apiData.VehicleRegistration?.FuelType,
            co2Emissions: apiData.VehicleRegistration?.Co2Emissions,
            rawData: data // Store full response
          };

          vehicle = await Vehicle.create(vehicleData);

      } else {
          const msg = data?.Response?.StatusMessage || 'Vehicle not found in remote database';
          return next(new AppError(msg, 404));
      }

    } catch (apiError) {
      // If axios fails entirely (network, 500 from remote)
      // We use a 502 Bad Gateway to indicate upstream error
      console.error('External API Error:', apiError.message);
      return next(new AppError('External Vehicle API unavailable', 502));
    }
  } else {
    // Update last searched time if found in cache
    vehicle.lastSearchedAt = Date.now();
    await vehicle.save();
  }

  // 3. Link to User History
  await User.findByIdAndUpdate(req.user.id, {
    $addToSet: { searchedVehicles: vehicle._id }
  });

  res.status(200).json({
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