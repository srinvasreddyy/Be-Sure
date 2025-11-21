// Utilities
const logger = require('./utils/logger'); // IMPORT LOGGER FIRST

// Handle uncaught exceptions immediately
process.on('uncaughtException', (err) => {
  // Use logger, not console. Pass full error object for stack trace.
  logger.error('UNCAUGHT EXCEPTION 💥 Shutting down...', {
    error: err,
    stack: err.stack
  });
  process.exit(1);
});

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
require('express-async-errors'); // Patch async handlers

// Load env vars
dotenv.config();

// Utilities
const globalErrorHandler = require('./middleware/errorMiddleware');
const AppError = require('./utils/AppError');

// Routes
const apiRoutes = require('./routes/api');

const app = express();

// Trust the first proxy (Render/Heroku/etc.) so that IP addresses are resolved correctly
// This fixes the ERR_ERL_UNEXPECTED_X_FORWARDED_FOR error
app.set('trust proxy', 1);

// Middleware
app.use(helmet()); // Set security headers
app.use(express.json()); // Body parser
app.use(cors()); // Enable CORS
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks

// Logging via Morgan (HTTP stream to Winston)
app.use(morgan('combined', { 
  stream: { write: message => logger.info(message.trim()) } 
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('MongoDB Connected');
  } catch (err) {
    // Use logger for DB connection errors as well
    logger.error('MongoDB Connection Error:', {
      error: err,
      stack: err.stack
    });
    process.exit(1);
  }
};

// Routes Mount
app.use('/api', apiRoutes);

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'OK', uptime: process.uptime() }));

// 404 Handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

// Start Server (only if not testing)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
  // const PORT = process.env.PORT || 5000;
  const PORT = process.env.PORT;
  const server = app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

  // Handle Unhandled Rejections
  process.on('unhandledRejection', (err) => {
    // Use logger, not console. Pass full error object for stack trace.
    logger.error('UNHANDLED REJECTION 💥 Shutting down...', {
      error: err,
      stack: err.stack
    });
    server.close(() => {
      process.exit(1);
    });
  });
}

module.exports = app;