const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // Use the err.keyValue object for a robust error message
  let message;
  if (err.keyValue) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    message = `Duplicate field value: "${value}". Please use another value!`;
  } else {
    // Fallback just in case keyValue is not available
    message = 'Duplicate field value entered. Please use another value!';
  }
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => 
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () => 
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
  logger.error(`DEV ERROR: ${err.message}`, { 
    error: err, 
    stack: err.stack,
    url: req.originalUrl
  });
  
  res.status(err.statusCode).json({
    success: false,
    error: err.message,
    stack: err.stack,
    rawError: err
  });
};

const sendErrorProd = (err, req, res) => {
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    // Operational errors are logged as warnings, as they are expected
    logger.warn(`OPERATIONAL ERROR: ${err.message}`, {
      url: req.originalUrl,
      status: err.statusCode
    });
    
    res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  } 
  // B) Programming or other unknown error: don't leak details
  else {
    // 1) Log error (as a critical error)
    logger.error('PROGRAMMING ERROR 💥', { 
      message: err.message, 
      stack: err.stack,
      url: req.originalUrl,
      error: err
    });

    // 2) Send generic message
    res.status(500).json({
      success: false,
      error: 'Something went very wrong!'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Use NODE_ENV from process.env
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else { // 'production' or any other value
    let error = { ...err };
    error.message = err.message;
    error.name = err.name; // Important for checks below
    error.stack = err.stack; // Ensure stack is copied
    error.keyValue = err.keyValue; // Ensure keyValue is copied
    error.code = err.code; // Ensure code is copied

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    // Pass req to sendErrorProd for logging
    sendErrorProd(error, req, res);
  }
};