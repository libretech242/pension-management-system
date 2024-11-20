const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Password complexity requirements
const passwordRequirements = {
  minLength: 8,
  minUppercase: 1,
  minLowercase: 1,
  minNumbers: 1,
  minSymbols: 1
};

// Custom password validation function
const validatePasswordComplexity = (password) => {
  const errors = [];
  
  if (password.length < passwordRequirements.minLength) {
    errors.push(`Password must be at least ${passwordRequirements.minLength} characters long`);
  }
  if ((password.match(/[A-Z]/g) || []).length < passwordRequirements.minUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if ((password.match(/[a-z]/g) || []).length < passwordRequirements.minLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if ((password.match(/[0-9]/g) || []).length < passwordRequirements.minNumbers) {
    errors.push('Password must contain at least one number');
  }
  if ((password.match(/[^A-Za-z0-9]/g) || []).length < passwordRequirements.minSymbols) {
    errors.push('Password must contain at least one special character');
  }

  return errors;
};

// Validation chain for login
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: passwordRequirements.minLength })
    .withMessage(`Password must be at least ${passwordRequirements.minLength} characters long`),

  // Custom validation middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Login validation failed:', {
        errors: errors.array(),
        email: req.body.email,
        ip: req.ip
      });

      // In development, return detailed error messages
      if (process.env.NODE_ENV === 'development') {
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }

      // In production, return generic error message
      return res.status(400).json({
        error: 'Invalid credentials',
        message: 'Please check your email and password'
      });
    }
    next();
  }
];

// Validation chain for registration
const validateRegistration = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .custom((value, { req }) => {
      const errors = validatePasswordComplexity(value);
      if (errors.length > 0) {
        throw new Error(errors.join('. '));
      }
      return true;
    }),
  
  body('first_name')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2 }).withMessage('First name must be at least 2 characters long')
    .matches(/^[A-Za-z\s-']+$/).withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('last_name')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters long')
    .matches(/^[A-Za-z\s-']+$/).withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),

  // Custom validation middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Registration validation failed:', {
        errors: errors.array(),
        email: req.body.email,
        ip: req.ip
      });

      return res.status(400).json({
        error: 'Validation Error',
        details: process.env.NODE_ENV === 'development' ? errors.array() : undefined,
        message: 'Please check your input and try again'
      });
    }
    next();
  }
];

// Validation chain for password reset
const validatePasswordReset = [
  body('password')
    .notEmpty().withMessage('Password is required')
    .custom((value, { req }) => {
      const errors = validatePasswordComplexity(value);
      if (errors.length > 0) {
        throw new Error(errors.join('. '));
      }
      return true;
    }),
  
  body('confirmPassword')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  // Custom validation middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Password reset validation failed', {
        errors: errors.array(),
        ip: req.ip
      });

      return res.status(400).json({
        error: 'Validation Error',
        details: process.env.NODE_ENV === 'development' ? errors.array() : undefined,
        message: 'Please check your password and try again'
      });
    }
    next();
  }
];

// Validation chain for forgot password
const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Forgot password validation failed:', {
        errors: errors.array(),
        email: req.body.email,
        ip: req.ip
      });

      return res.status(400).json({
        error: 'Validation Error',
        details: process.env.NODE_ENV === 'development' ? errors.array() : undefined,
        message: 'Please check your email and try again'
      });
    }
    next();
  }
];

// Validation chain for reset password with token
const validateResetPassword = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .custom((value, { req }) => {
      const errors = validatePasswordComplexity(value);
      if (errors.length > 0) {
        throw new Error(errors.join('. '));
      }
      return true;
    }),
  
  body('confirmPassword')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Reset password validation failed:', {
        errors: errors.array(),
        ip: req.ip
      });

      return res.status(400).json({
        error: 'Validation Error',
        details: process.env.NODE_ENV === 'development' ? errors.array() : undefined,
        message: 'Please check your input and try again'
      });
    }
    next();
  }
];

module.exports = {
  validateLogin,
  validateRegistration,
  validatePasswordReset,
  validateForgotPassword,
  validateResetPassword,
  passwordRequirements
};
