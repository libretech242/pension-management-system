const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Common validation patterns
const patterns = {
  email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
  name: /^[A-Za-z\s-']+$/,
  password: {
    minLength: 8,
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1
  }
};

// Validation helper functions
const validateEmail = (email) => {
  if (!email || !patterns.email.test(email)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address'
    };
  }
  return { isValid: true };
};

const validatePassword = (password, requirements = patterns.password) => {
  const errors = [];
  
  if (!password || password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }
  if ((password.match(/[A-Z]/g) || []).length < requirements.minUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if ((password.match(/[a-z]/g) || []).length < requirements.minLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if ((password.match(/[0-9]/g) || []).length < requirements.minNumbers) {
    errors.push('Password must contain at least one number');
  }
  if ((password.match(/[^A-Za-z0-9]/g) || []).length < requirements.minSymbols) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateName = (name, fieldName = 'Name') => {
  if (!name || !patterns.name.test(name)) {
    return {
      isValid: false,
      error: `${fieldName} must contain only letters, spaces, hyphens, and apostrophes`
    };
  }
  return { isValid: true };
};

// Validation middleware factory
const createValidationMiddleware = (validations, options = {}) => {
  return (req, res, next) => {
    const errors = [];
    
    // Run all validations
    for (const validate of validations) {
      const result = validate(req.body);
      if (!result.isValid) {
        if (Array.isArray(result.errors)) {
          errors.push(...result.errors);
        } else if (result.error) {
          errors.push(result.error);
        }
      }
    }

    // Handle validation failures
    if (errors.length > 0) {
      if (options.logFailures) {
        logger.warn('Validation failed:', {
          path: req.path,
          errors: errors,
          body: options.detailedErrors ? req.body : undefined
        });
      }

      return res.status(400).json({
        error: 'Validation Error',
        errors: errors
      });
    }

    next();
  };
};

// Export validation patterns and functions
module.exports = {
  patterns,
  validateEmail,
  validatePassword,
  validateName,
  createValidationMiddleware
};
