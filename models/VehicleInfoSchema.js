const mongoose = require('mongoose');

const vehicleInfoSchema = new mongoose.Schema({
  buyMonth: { type: String },
  buyYear: { type: String },
  notPurchased: { type: Boolean, default: false },
  registeredKeeper: { type: String, trim: true },
  keeperRelation: { type: String, trim: true },
  parkingLocation: { type: String, trim: true },
  mileage: { type: Number, default: 10000 },
  mileageUnit: { type: String, default: 'miles' },
  householdCars: { type: String },
  otherVehicleAccess: { type: String },
  isFilled: { type: Boolean, default: false }
});

module.exports = vehicleInfoSchema;