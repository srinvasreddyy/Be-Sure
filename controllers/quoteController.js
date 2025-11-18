const mongoose = require('mongoose');
const CarQuote = require('../models/CarQuote');
const AppError = require('../utils/AppError');
const validation = require('../utils/validationSchemas');
const logger = require('../utils/logger');

/**
 * @desc    Create a new, in-progress car quote
 * @route   POST /api/quote/start
 * @access  Private
 */
exports.createQuote = async (req, res, next) => {
  // 1. Validate input (must have vehicleDetails)
  const { error } = validation.createQuoteSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  
  const { vehicleDetails } = req.body;

  // 2. Create the quote document
  const quote = await CarQuote.create({
    user: req.user.id,
    status: 'in-progress',
    vehicleDetails: vehicleDetails
  });

  logger.info(`New quote created: ${quote._id} for user: ${req.user.id}`);

  // 3. Return the new quote
  res.status(201).json({
    success: true,
    data: quote
  });
};

/**
 * @desc    Get a single quote by its ID
 * @route   GET /api/quote/:quoteId
 * @access  Private
 */
exports.getQuote = async (req, res, next) => {
  const { quoteId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(quoteId)) {
    return next(new AppError('Invalid quote ID', 400));
  }

  const quote = await CarQuote.findById(quoteId);

  // Check if quote exists
  if (!quote) {
    return next(new AppError('Quote not found', 404));
  }

  // Security: Check if the quote belongs to the logged-in user
  if (quote.user.toString() !== req.user.id) {
    logger.warn(`Auth failure: User ${req.user.id} tried to access quote ${quote._id}`);
    return next(new AppError('Not authorized to access this quote', 403));
  }

  res.status(200).json({
    success: true,
    data: quote
  });
};


/**
 * Factory function to create an update handler for a specific quote step.
 * @param {string} stepName - The key on the CarQuote model (e.g., 'driverInfo', 'licenseInfo')
 * @param {Joi.Schema} validationSchema - The Joi schema to validate req.body against
 */
const updateQuoteStep = (stepName, validationSchema) => {
  return async (req, res, next) => {
    // 1. Validate request body
    const { error } = validationSchema.validate(req.body);
    if (error) {
      return next(new AppError(error.details[0].message, 400));
    }

    const { quoteId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
      return next(new AppError('Invalid quote ID', 400));
    }

    // 2. Find the quote
    const quote = await CarQuote.findById(quoteId);

    if (!quote) {
      return next(new AppError('Quote not found', 404));
    }

    // 3. Security: Check Ownership
    if (quote.user.toString() !== req.user.id) {
      logger.warn(`Auth failure: User ${req.user.id} tried to update quote ${quote._id}`);
      return next(new AppError('Not authorized to update this quote', 403));
    }

    // 4. Check if quote is already purchased
    if (quote.status === 'purchased') {
      return next(new AppError('Cannot update a purchased quote', 400));
    }

    // 5. Update the sub-document and mark as filled
    quote[stepName] = {
      ...req.body,
      isFilled: true
    };

    // 6. Save the quote
    await quote.save({ validateModifiedOnly: true }); // Avoid re-validating unmodified parts
    
    logger.info(`Updated ${stepName} for quote: ${quote._id}`);

    // 7. Return the updated quote
    res.status(200).json({
      success: true,
      data: quote
    });
  };
};

// --- Create and export handlers using the factory ---

// @desc    Update Vehicle Info step
// @route   POST /api/quote/:quoteId/vehicle-info
// @access  Private
exports.updateVehicleInfo = updateQuoteStep('vehicleInfo', validation.vehicleInfo);

// @desc    Update Driver Info step
// @route   POST /api/quote/:quoteId/driver-info
// @access  Private
exports.updateDriverInfo = updateQuoteStep('driverInfo', validation.driverInfo);

// @desc    Update License Info step
// @route   POST /api/quote/:quoteId/license-info
// @access  Private
exports.updateLicenseInfo = updateQuoteStep('licenseInfo', validation.licenseInfo);

// @desc    Update History Info step
// @route   POST /api/quote/:quoteId/history-info
// @access  Private
exports.updateHistoryInfo = updateQuoteStep('historyInfo', validation.historyInfo);

// @desc    Update Usage Info step
// @route   POST /api/quote/:quoteId/usage-info
// @access  Private
exports.updateUsageInfo = updateQuoteStep('usageInfo', validation.usageInfo);

// @desc    Update Payment Info step
// @route   POST /api/quote/:quoteId/payment-info
// @access  Private
exports.updatePaymentInfo = updateQuoteStep('paymentInfo', validation.paymentInfo);