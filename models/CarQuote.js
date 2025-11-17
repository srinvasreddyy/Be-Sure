const mongoose = require('mongoose');
const vehicleInfoSchema = require('./schemas/VehicleInfoSchema');
const driverInfoSchema = require('./schemas/DriverInfoSchema');
const licenseInfoSchema = require('./schemas/LicenseInfoSchema');
const historyInfoSchema = require('./schemas/HistoryInfoSchema');
const usageInfoSchema = require('./schemas/UsageInfoSchema');
const paymentInfoSchema = require('./schemas/PaymentInfoSchema');

const carQuoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'purchased'],
    default: 'in-progress'
  },
  
  // From the "Find Vehicle" step
  vehicleDetails: {
    plate: { type: String, required: true },
    manufacturer: { type: String },
    model: { type: String },
    trim: { type: String },
    year: { type: String },
    transmission: { type: String },
    fuelType: { type: String },
    engineSize: { type: String },
    value: { type: String },
    isImport: { type: String },
    driveSide: { type: String },
    seats: { type: String }
  },

  // Embedded schemas for each step
  vehicleInfo: vehicleInfoSchema,
  driverInfo: driverInfoSchema,
  licenseInfo: licenseInfoSchema,
  historyInfo: historyInfoSchema,
  usageInfo: usageInfoSchema,
  paymentInfo: paymentInfoSchema,
  
  // Final quote price
  quotePrice: {
    type: Number
  },

}, { timestamps: true });

const CarQuote = mongoose.model('CarQuote', carQuoteSchema);

module.exports = CarQuote;