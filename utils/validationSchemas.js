const Joi = require('joi');

// --- Auth Schemas (NEW) ---
exports.registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

exports.verifyOTPSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required()
});

exports.resendVerificationSchema = Joi.object({
  email: Joi.string().email().required()
});

exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

exports.resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required()
});


// --- Vehicle Details (for creating a quote) ---
const vehicleDetailsSchema = Joi.object({
  plate: Joi.string().required(),
  manufacturer: Joi.string().allow('').optional(),
  model: Joi.string().allow('').optional(),
  trim: Joi.string().allow('').optional(),
  year: Joi.string().allow('').optional(),
  transmission: Joi.string().allow('').optional(),
  fuelType: Joi.string().allow('').optional(),
  engineSize: Joi.string().allow('').optional(),
  value: Joi.string().allow('').optional(),
  isImport: Joi.string().allow('').optional(),
  driveSide: Joi.string().allow('').optional(),
  seats: Joi.string().allow('').optional()
});

exports.createQuoteSchema = Joi.object({
  vehicleDetails: vehicleDetailsSchema.required()
});

// --- Sub-schema Validations ---
// (No changes to the quote-related schemas)
exports.vehicleInfo = Joi.object({
  buyMonth: Joi.string().allow('').optional(),
  buyYear: Joi.string().allow('').optional(),
  notPurchased: Joi.boolean().optional(),
  registeredKeeper: Joi.string().allow('').optional(),
  keeperRelation: Joi.string().allow('').optional(),
  parkingLocation: Joi.string().allow('').optional(),
  mileage: Joi.number().integer().min(0).optional(),
  mileageUnit: Joi.string().allow('').optional(),
  householdCars: Joi.string().allow('').optional(),
  otherVehicleAccess: Joi.string().allow('').optional(),
});

exports.driverInfo = Joi.object({
  dobDay: Joi.string().allow('').optional(),
  dobMonth: Joi.string().allow('').optional(),
  dobYear: Joi.string().allow('').optional(),
  postcode: Joi.string().allow('').optional(),
  propertyOwner: Joi.string().allow('').optional(),
  isStudent: Joi.string().allow('').optional(),
  medicalCondition: Joi.string().allow('').optional(),
  employmentStatus: Joi.string().allow('').optional(),
  referralSource: Joi.string().allow('').optional(),
});

exports.licenseInfo = Joi.object({
  licenceType: Joi.string().allow('').optional(),
  ukLicenceMonth: Joi.string().allow('').optional(),
  ukLicenceYear: Joi.string().allow('').optional(),
  licenceNumber: Joi.string().allow('').optional(),
  hasOtherCountryLicence: Joi.string().allow('').optional(),
  otherCountry: Joi.string().allow('').optional(),
  otherLicenceMonth: Joi.string().allow('').optional(),
  otherLicenceYear: Joi.string().allow('').optional(),
  otherLicenceNumber: Joi.string().allow('').optional(),
});

exports.historyInfo = Joi.object({
  claimsLast5Years: Joi.string().allow('').optional(),
  convictionsLast5Years: Joi.string().allow('').optional(),
  previousInsurance: Joi.string().allow('').optional(),
  criminalConvictions: Joi.string().allow('').optional(),
});

exports.usageInfo = Joi.object({
  carUsage: Joi.string().allow('').optional(),
  policyCancelled: Joi.string().allow('').optional(),
});

exports.paymentInfo = Joi.object({
  startDate: Joi.string().allow('').optional(),
  paymentMethod: Joi.string().allow('').optional(),
  customDate: Joi.string().allow('').optional(),
});