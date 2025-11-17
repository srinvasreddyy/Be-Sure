const mongoose = require('mongoose');

const historyInfoSchema = new mongoose.Schema({
  claimsLast5Years: { type: String },
  convictionsLast5Years: { type: String },
  previousInsurance: { type: String },
  criminalConvictions: { type: String },
  isFilled: { type: Boolean, default: false }
});

module.exports = historyInfoSchema;