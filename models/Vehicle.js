const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  vrm: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true // Faster lookups
  },
  make: String,
  model: String,
  color: String,
  yearOfManufacture: String,
  engineCapacity: String,
  fuelType: String,
  co2Emissions: String,
  // Store the full raw API response just in case we need extra fields later
  rawData: {
    type: mongoose.Schema.Types.Mixed
  },
  lastSearchedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Vehicle', VehicleSchema);