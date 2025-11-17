const mongoose = require('mongoose');

const driverInfoSchema = new mongoose.Schema({
  dobDay: { type: String },
  dobMonth: { type: String },
  dobYear: { type: String },
  postcode: { type: String, trim: true },
  propertyOwner: { type: String },
  isStudent: { type: String },
  medicalCondition: { type: String },
  employmentStatus: { type: String },
  referralSource: { type: String },
  isFilled: { type: Boolean, default: false }
});

module.exports = driverInfoSchema;