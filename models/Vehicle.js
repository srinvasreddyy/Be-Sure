//
const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  vrm: {
    type: String,
    required: [true, 'Licence plate number (VRM) is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required']
  },
  model: {
    type: String,
    required: [true, 'Model is required'] 
    // This will be filled by the user on the frontend before saving
  },
  trim: {
    type: String,
    default: ''
  },
  automatedVehicle: {
    type: Boolean,
    required: [true, 'Automated Vehicle status is required'],
    default: false
  },
  co2Emissions: {
    type: Number,
    required: [true, 'CO2 Emissions are required']
  },
  fuelType: {
    type: String,
    required: [true, 'Fuel Type is required']
  },
  engineCapacity: {
    type: Number,
    required: [true, 'Engine Capacity is required']
  },
  yearOfManufacture: {
    type: Number,
    required: [true, 'Year of Manufacture is required']
  },
  colour: {
    type: String,
    required: [true, 'Colour is required']
  },
  lastSearchedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Vehicle', VehicleSchema);