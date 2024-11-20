const { body, param } = require('express-validator');
const { validateRequest } = require('./validateRequest');

const validatePayrollEntry = [
  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isInt()
    .withMessage('Invalid employee ID'),

  body('payPeriod')
    .notEmpty()
    .withMessage('Pay period is required')
    .isISO8601()
    .withMessage('Invalid pay period date format'),

  body('grossPay')
    .notEmpty()
    .withMessage('Gross pay is required')
    .isFloat({ min: 0 })
    .withMessage('Gross pay must be a positive number'),

  body('pensionContribution')
    .notEmpty()
    .withMessage('Pension contribution is required')
    .isFloat({ min: 0 })
    .withMessage('Pension contribution must be a positive number')
    .custom((value, { req }) => {
      const grossPay = parseFloat(req.body.grossPay);
      const contribution = parseFloat(value);
      if (contribution > grossPay * 0.5) {
        throw new Error('Pension contribution cannot exceed 50% of gross pay');
      }
      return true;
    }),

  body('deductions')
    .optional()
    .isArray()
    .withMessage('Deductions must be an array'),

  body('deductions.*.type')
    .optional()
    .isIn(['tax', 'insurance', 'loan', 'other'])
    .withMessage('Invalid deduction type'),

  body('deductions.*.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Deduction amount must be a positive number'),

  body('status')
    .optional()
    .isIn(['pending', 'processed', 'completed'])
    .withMessage('Invalid payroll status'),

  validateRequest
];

const validatePayrollPeriod = [
  param('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid start date format'),

  param('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      const startDate = new Date(req.params.startDate);
      const endDate = new Date(value);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  validateRequest
];

module.exports = {
  validatePayrollEntry,
  validatePayrollPeriod
};
