const logger = require('../utils/logger');
const { validateEmail, validatePassword, createValidationMiddleware } = require('../services/validationService');

// Login request validation middleware
const validateLoginRequest = createValidationMiddleware([
  ({ email }) => validateEmail(email),
  ({ password }) => ({ isValid: !!password, error: 'Password is required' })
], {
  logFailures: true,
  detailedErrors: process.env.NODE_ENV === 'development'
});

// Rate limiting helper (tracks failed attempts)
const failedLoginAttempts = new Map();

// Login attempt tracking middleware
const trackLoginAttempts = (req, res, next) => {
  const clientIp = req.ip;
  
  if (!failedLoginAttempts.has(clientIp)) {
    failedLoginAttempts.set(clientIp, {
      count: 0,
      firstAttempt: Date.now(),
      lastAttempt: Date.now()
    });
  }

  const attempts = failedLoginAttempts.get(clientIp);
  attempts.lastAttempt = Date.now();

  // Reset attempts if more than 15 minutes have passed
  if (Date.now() - attempts.firstAttempt > 15 * 60 * 1000) {
    attempts.count = 0;
    attempts.firstAttempt = Date.now();
  }

  req.loginAttempts = {
    count: attempts.count,
    increment: () => {
      attempts.count += 1;
      return attempts.count;
    },
    reset: () => {
      attempts.count = 0;
      attempts.firstAttempt = Date.now();
    }
  };

  next();
};

// Success tracking middleware
const handleLoginSuccess = (req, res, next) => {
  const clientIp = req.ip;
  failedLoginAttempts.delete(clientIp);
  next();
};

// Failure tracking middleware
const handleLoginFailure = (req, res, next) => {
  if (req.loginAttempts) {
    const attempts = req.loginAttempts.increment();
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Failed login attempt:', {
        ip: req.ip,
        email: req.body.email,
        attemptNumber: attempts
      });
    }
  }
  next();
};

module.exports = {
  validateLoginRequest,
  trackLoginAttempts,
  handleLoginSuccess,
  handleLoginFailure
};
