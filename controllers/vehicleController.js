const axios = require('axios');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

// @desc    Search Vehicle by VRM
// @route   POST /api/vehicle/search
// @access  Private
exports.searchVehicle = async (req, res) => {
  try {
    let { vrm } = req.body;
    
    if (!vrm) {
      return res.status(400).json({ success: false, error: 'Please provide a Licence Plate Number (VRM)' });
    }

    // Sanitize VRM (Remove spaces, uppercase)
    vrm = vrm.replace(/\s/g, '').toUpperCase();

    // 1. Check DB Cache first
    let vehicle = await Vehicle.findOne({ vrm });

    if (!vehicle) {
      // 2. Fetch from API if not in DB
      // Using UK Vehicle Data API
      // URL structure: https://ukvehicledata.co.uk/api/datapackage/{Package}?v=2&api_nullitems=1&auth_apikey={Key}&key_VRM={VRM}
      
      const apiKey = process.env.UK_VEHICLE_API_KEY;
      const packageType = process.env.UK_VEHICLE_PACKAGE || 'VehicleData';
      
      const apiUrl = `https://ukvehicledata.co.uk/api/datapackage/${packageType}?v=2&api_nullitems=1&auth_apikey=${apiKey}&key_VRM=${vrm}`;

      try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Check API specific success codes (Usually Response.StatusCode)
        if (data && data.Response && data.Response.StatusCode === 'Success') {
           const apiData = data.Response.DataItems;
           
           // Map API response to our schema
           // Note: Adjust these fields based on exact JSON response from your package
           const vehicleData = {
             vrm: vrm,
             make: apiData.VehicleRegistration?.Make || 'Unknown',
             model: apiData.VehicleRegistration?.Model || 'Unknown',
             color: apiData.VehicleRegistration?.Colour || 'Unknown',
             yearOfManufacture: apiData.VehicleRegistration?.YearOfManufacture,
             engineCapacity: apiData.VehicleRegistration?.EngineCapacity,
             fuelType: apiData.VehicleRegistration?.FuelType,
             co2Emissions: apiData.VehicleRegistration?.Co2Emissions,
             rawData: data // Store full response for safety
           };

           vehicle = await Vehicle.create(vehicleData);

        } else {
           const msg = data?.Response?.StatusMessage || 'Vehicle not found in remote database';
           return res.status(404).json({ success: false, error: msg });
        }

      } catch (apiError) {
        console.error('External API Error:', apiError.message);
        return res.status(502).json({ success: false, error: 'External Vehicle API unavailable' });
      }
    } else {
      // Update last searched time if found in cache
      vehicle.lastSearchedAt = Date.now();
      await vehicle.save();
    }

    // 3. Link to User History
    // Add to user's array if not already there to prevent duplicates in list
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { searchedVehicles: vehicle._id }
    });

    res.status(200).json({
      success: true,
      data: vehicle
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get User's Search History
// @route   GET /api/vehicle/history
// @access  Private
exports.getHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('searchedVehicles');
    
    res.status(200).json({
      success: true,
      count: user.searchedVehicles.length,
      data: user.searchedVehicles
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};