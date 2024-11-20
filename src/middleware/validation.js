const { body, query, validationResult } = require('express-validator');
const { isValid, isBefore, isAfter, parseISO } = require('date-fns');

// Validation middleware for login
const validateLogin = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validation middleware for registration
const validateRegistration = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/)
    .withMessage('Password must include one lowercase letter, one uppercase letter, one number, and one special character'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validation middleware for password change
const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/)
    .withMessage('New password must include one lowercase letter, one uppercase letter, one number, and one special character'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validation middleware for employee
const validateEmployee = (req, res, next) => {
  const { nibNumber, firstName, lastName, position, employeeType, company, contributionPercentage } = req.body;

  // Basic validation
  if (!nibNumber || !firstName || !lastName || !position || !employeeType || !company || !contributionPercentage) {
    return res.status(400).json({
      error: 'Missing required fields'
    });
  }

  // NIB number validation (assuming format NIB-XXXXXX)
  const nibRegex = /^NIB-\d{6}$/;
  if (!nibRegex.test(nibNumber)) {
    return res.status(400).json({
      error: 'Invalid NIB number format. Should be NIB-XXXXXX where X is a digit'
    });
  }

  // Contribution percentage validation
  if (contributionPercentage < 0 || contributionPercentage > 100) {
    return res.status(400).json({
      error: 'Contribution percentage must be between 0 and 100'
    });
  }

  // Employee type validation
  const validTypes = ['management', 'line staff', 'contract'];
  if (!validTypes.includes(employeeType.toLowerCase())) {
    return res.status(400).json({
      error: 'Invalid employee type. Must be one of: management, line staff, contract'
    });
  }

  next();
};

// Validation middleware for date ranges
const validateDateRange = [
  query('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (!isValid(parseISO(value))) {
        throw new Error('Invalid start date');
      }
      return true;
    }),
  query('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (!isValid(parseISO(value))) {
        throw new Error('Invalid end date');
      }
      if (isBefore(parseISO(value), parseISO(req.query.startDate))) {
        throw new Error('End date must be after start date');
      }
      if (isAfter(parseISO(value), new Date())) {
        throw new Error('End date cannot be in the future');
      }
      return true;
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateLogin,
  validateRegistration,
  validatePasswordChange,
  validateEmployee,
  validateDateRange
};
