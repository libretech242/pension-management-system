const { body } = require('express-validator');
const { validateRequest } = require('./validateRequest');

const validateEmployee = [
  // Required fields
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('nibNumber')
    .notEmpty()
    .withMessage('NIB number is required')
    .trim()
    .matches(/^[A-Z0-9]{8,12}$/)
    .withMessage('Invalid NIB number format'),

  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom(value => {
      const dob = new Date(value);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();
      if (age < 16 || age > 100) {
        throw new Error('Employee must be between 16 and 100 years old');
      }
      return true;
    }),

  body('employeeType')
    .notEmpty()
    .withMessage('Employee type is required')
    .isIn(['full-time', 'part-time', 'contract'])
    .withMessage('Invalid employee type'),

  body('company')
    .notEmpty()
    .withMessage('Company is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),

  // Optional fields
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .matches(/^\+?1?\d{9,15}$/)
    .withMessage('Invalid phone number format'),

  body('address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),

  body('position')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Position must be between 2 and 100 characters'),

  body('department')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Department must be between 2 and 100 characters'),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),

  body('salary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Salary must be a positive number'),

  // Run the validation
  validateRequest
];

module.exports = {
  validateEmployee
};
