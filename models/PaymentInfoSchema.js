const mongoose = require('mongoose');

const paymentInfoSchema = new mongoose.Schema({
  startDate: { type: String },
  paymentMethod: { type: String },
  customDate: { type: String }, // Stores the date if 'custom' is chosen
  isFilled: { type: Boolean, default: false }
});

module.exports = paymentInfoSchema;