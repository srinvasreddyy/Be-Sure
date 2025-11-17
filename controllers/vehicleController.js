const axios = require('axios');
const cheerio = require('cheerio'); // Import cheerio
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * NEW Helper function to find data in the new HTML structure.
 * It looks for a <div class="data-type"> with the matching label
 * and returns the text of its sibling <div class="data-value">.
 */
const findRowData = ($, label) => {
  try {
    let value = '';
    // Find all 'data-type' divs
    $('div.data-type').each((index, element) => {
      // Check if the text matches the label (case-insensitive)
      if ($(element).text().trim().toLowerCase() === label.toLowerCase()) {
        // Get the sibling 'data-value' div's text
        value = $(element).siblings('div.data-value').text().trim();
        return false; // Exit the .each() loop once found
      }
    });
    return value;
  } catch (e) {
    console.error(`Error extracting ${label}:`, e.message);
  }
  return '';
};


// @desc    Step 1: Fetch Vehicle Data (from DB or Web Scraper)
// @route   POST /api/vehicle/search
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

  // 2. If not in DB, fetch from carcheckfree.co.uk
  const scrapeUrl = `https://www.carcheckfree.co.uk/cardetails/${vrm}`;

  try {
    const response = await axios.get(scrapeUrl, {
      headers: {
        // Add a common user-agent to mimic a browser
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);

    // Map scraped data to our Schema structure using NEW LABELS
    const vehicleData = {
      vrm: findRowData($, 'VRM') || vrm,
      manufacturer: findRowData($, 'Make'), // Label changed from "Manufacturer"
      model: findRowData($, 'Model'),
      trim: '', // NOTE: "Trim" is not available as a separate field in the provided HTML.
      yearOfManufacture: parseInt(findRowData($, 'Year of manufacture'), 10) || null, // Label changed
      fuelType: findRowData($, 'Fuel type'),
      engineCapacity: parseInt(findRowData($, 'Engine capacity'), 10) || null, // Label changed
      isImport: false, // NOTE: "Import" is not available in the provided HTML. Defaulting to false.
      automatedVehicle: false, // NOTE: Not available in HTML. Defaulting to false.
      co2Emissions: parseInt(findRowData($, 'CO2 emissions'), 10) || 0,
      colour: findRowData($, 'Colour') || 'Unknown'
    };
    
    // Check if essential data was found
    if (!vehicleData.manufacturer || !vehicleData.model) {
        return next(new AppError('Vehicle not found or website structure changed', 404));
    }

    // This section is no longer needed as we are populating all fields
    // directly from the scrape or with defaults.
    /*
    const dvlaData = {
        automatedVehicle: false,
        co2Emissions: 0,
        colour: 'Unknown',
        ...vehicleData // This overwrites defaults with scraped data
    };
    */

    res.status(200).json({
      success: true,
      source: 'web_scraper', // Inform frontend data came from scraper
      data: vehicleData // Send the populated vehicleData object
    });

  } catch (apiError) {
    console.error('Web Scraper Error:', apiError.message);
    
    if (apiError.response && apiError.response.status === 404) {
        return next(new AppError('Vehicle not found on carcheckfree.co.uk', 404));
    }

    return next(new AppError('External Vehicle Scraper unavailable', 502));
  }
};

// @desc    Step 2: Save Complete Vehicle Data
// @route   POST /api/vehicle/save
// @access  Private
exports.saveVehicle = async (req, res, next) => {
  const { 
    vrm, manufacturer, model, trim, // Added trim
    automatedVehicle, co2Emissions, fuelType, 
    engineCapacity, yearOfManufacture, colour 
  } = req.body;

  // 1. Upsert Vehicle (Create if new, Update if exists)
  // We run validators to ensure 'model' and other required fields are present
  const vehicle = await Vehicle.findOneAndUpdate(
    { vrm },
    {
      vrm, manufacturer, model, trim, // Added trim
      automatedVehicle, co2Emissions, fuelType, 
      engineCapacity, yearOfManufacture, colour,
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