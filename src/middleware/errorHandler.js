const Sentry = require('@sentry/node');
const { ValidationError } = require('sequelize');
const logger = require('../utils/logger');

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    new Sentry.Integrations.Postgres(),
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
});

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
    Error.captureStackTrace(this, this.constructor);
  }
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request processed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  // Log error details
  logger.error('Error occurred', {
    error: {
      type: err.type || 'UnknownError',
      message: err.message,
      stack: err.stack,
      details: err.details
    },
    request: {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      body: req.body,
      ip: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  // Send error to Sentry if in production
  if (process.env.NODE_ENV === 'production') {
    Sentry.withScope(scope => {
      scope.setExtra('request_details', {
        method: req.method,
        url: req.url,
        params: req.params,
        query: req.query
      });
      Sentry.captureException(err);
    });
  }

  next(err);
};

// Error response handler
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || {};

  // Handle specific error types
  if (err instanceof ValidationError) {
    statusCode = 400;
    message = 'Validation Error';
    details = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // Send error response
  const errorResponse = {
    error: {
      type: err.type || 'UnknownError',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      ...(Object.keys(details).length > 0 && { details })
    }
  };

  // Add Sentry error tracking ID in production
  if (process.env.NODE_ENV === 'production' && res.sentry) {
    errorResponse.error.trackingId = res.sentry;
  }

  res.status(statusCode).json(errorResponse);
};

// Not found handler
const notFoundHandler = (req, res, next) => {
  const err = new AppError(
    `Route not found: ${req.method} ${req.url}`,
    errorTypes.NOT_FOUND_ERROR,
    404
  );
  next(err);
};

module.exports = {
  AppError,
  errorTypes,
  requestLogger,
  errorLogger,
  errorHandler,
  notFoundHandler,
  Sentry
};
