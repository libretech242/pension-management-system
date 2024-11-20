const { body, param, query } = require('express-validator');
const { validateRequest } = require('./validateRequest');

const validatePensionContribution = [
  // Required fields
  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isUUID()
    .withMessage('Invalid Employee ID format'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),

  body('contributionDate')
    .notEmpty()
    .withMessage('Contribution date is required')
    .isISO8601()
    .withMessage('Invalid date format'),

  // Optional fields with validation
  body('contributionType')
    .optional()
    .isIn(['employer', 'employee', 'voluntary'])
    .withMessage('Invalid contribution type'),

  body('payrollId')
    .optional()
    .isUUID()
    .withMessage('Invalid Payroll ID format'),

  body('status')
    .optional()
    .isIn(['pending', 'processed', 'failed'])
    .withMessage('Invalid status'),

  // Run the validation
  validateRequest
];

const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((endDate, { req }) => {
      if (endDate && req.query.startDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end < start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),

  validateRequest
];

const validatePensionId = [
  param('id')
    .notEmpty()
    .withMessage('Pension contribution ID is required')
    .isUUID()
    .withMessage('Invalid pension contribution ID format'),

  validateRequest
];

module.exports = {
  validatePensionContribution,
  validateDateRange,
  validatePensionId
};
