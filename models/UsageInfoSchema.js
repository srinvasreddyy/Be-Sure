const mongoose = require('mongoose');

const usageInfoSchema = new mongoose.Schema({
  carUsage: { type: String },
  policyCancelled: { type: String },
  isFilled: { type: Boolean, default: false }
});

module.exports = usageInfoSchema;