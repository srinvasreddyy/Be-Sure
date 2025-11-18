const mongoose = require('mongoose');
const vehicleInfoSchema = require('./VehicleInfoSchema');
const driverInfoSchema = require('./DriverInfoSchema');
const licenseInfoSchema = require('./LicenseInfoSchema');
const historyInfoSchema = require('./HistoryInfoSchema');
const usageInfoSchema = require('./UsageInfoSchema');
const paymentInfoSchema = require('./PaymentInfoSchema');

const carQuoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Add index for faster lookups by user
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
    year: { type: String }, // Can be string or number, let's keep as string for consistency from scrape
    transmission: { type: String },
    fuelType: { type: String },
    engineSize: { type: String }, // Can be string or number
    value: { type: String }, // Estimated value, user input
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
  
  // Final quote price (to be set by a future quote engine)
  quotePrice: {
    type: Number
  },

}, { timestamps: true }); // timestamps adds createdAt and updatedAt

const CarQuote = mongoose.model('CarQuote', carQuoteSchema);

module.exports = CarQuote;