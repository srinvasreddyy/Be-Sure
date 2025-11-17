const mongoose = require('mongoose');

const licenseInfoSchema = new mongoose.Schema({
  licenceType: { type: String },
  ukLicenceMonth: { type: String },
  ukLicenceYear: { type: String },
  licenceNumber: { type: String, trim: true },
  hasOtherCountryLicence: { type: String },
  otherCountry: { type: String, trim: true },
  otherLicenceMonth: { type: String },
  otherLicenceYear: { type: String },
  otherLicenceNumber: { type: String, trim: true },
  isFilled: { type: Boolean, default: false }
});

module.exports = licenseInfoSchema;