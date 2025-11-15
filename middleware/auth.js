const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized to access this route', 401));
  }

  // Verify token
  // jsonwebtoken errors (JsonWebTokenError, TokenExpiredError) are now caught by express-async-errors
  // and handled in errorMiddleware
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  req.user = await User.findById(decoded.id);
  if (!req.user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  next();
};