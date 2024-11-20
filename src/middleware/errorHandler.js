const { ValidationError } = require('sequelize');
const logger = require('../utils/logger');

// Error types
const errorTypes = {
  VALIDATION_ERROR: 'ValidationError',
  AUTHENTICATION_ERROR: 'AuthenticationError',
  AUTHORIZATION_ERROR: 'AuthorizationError',
  NOT_FOUND_ERROR: 'NotFoundError',
  DATABASE_ERROR: 'DatabaseError',
  RATE_LIMIT_ERROR: 'RateLimitError'
};

class AppError extends Error {
  constructor(message, type, statusCode, details = {}) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const logData = {
    type: err.type || 'UnknownError',
    message: err.message,
    statusCode: err.statusCode || 500,
    path: req.path,
    method: req.method,
    timestamp: err.timestamp || new Date().toISOString(),
    requestId: req.id,
    userId: req.user?.id
  };

  if (isDevelopment) {
    logData.stack = err.stack;
    logData.details = err.details;
    logData.body = req.body;
    logData.query = req.query;
  }

  logger.error('Error occurred:', logData);
  next(err);
};

// Error response handler
const errorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let type = err.type || 'UnknownError';
  let details = err.details || {};

  // Handle Sequelize validation errors
  if (err instanceof ValidationError) {
    statusCode = 400;
    type = errorTypes.VALIDATION_ERROR;
    message = 'Validation Error';
    details = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
  }

  const response = {
    error: {
      type,
      message,
      ...(isDevelopment && {
        details,
        stack: err.stack,
        timestamp: err.timestamp || new Date().toISOString()
      })
    }
  };

  res.status(statusCode).json(response);
};

// Not found handler
const notFoundHandler = (req, res) => {
  const error = new AppError(
    `Cannot ${req.method} ${req.path}`,
    errorTypes.NOT_FOUND_ERROR,
    404,
    { path: req.path, method: req.method }
  );
  
  res.status(404).json({
    error: {
      type: error.type,
      message: error.message,
      details: error.details
    }
  });
};

module.exports = {
  AppError,
  errorTypes,
  errorLogger,
  errorHandler,
  notFoundHandler
};
