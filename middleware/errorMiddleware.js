const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
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

const sendErrorDev = (err, res) => {
  logger.error(`DEV ERROR: ${err.message}`, { stack: err.stack });
  
  res.status(err.statusCode).json({
    success: false,
    error: err.message,
    stack: err.stack,
    rawError: err
  });
};

const sendErrorProd = (err, res) => {
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    logger.warn(`OPERATIONAL ERROR: ${err.message}`);
    
    res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  } 
  // B) Programming or other unknown error: don't leak details
  else {
    // 1) Log error
    logger.error('PROGRAMMING ERROR 💥', { 
      message: err.message, 
      stack: err.stack 
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

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name; // Important for checks below

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};