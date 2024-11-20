const { query, param } = require('express-validator');
const { validateRequest } = require('./validateRequest');

const validateReportQuery = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (req.query.startDate && value) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),

  query('reportType')
    .optional()
    .isIn(['summary', 'detailed', 'compliance', 'audit'])
    .withMessage('Invalid report type'),

  query('format')
    .optional()
    .isIn(['pdf', 'excel', 'csv'])
    .withMessage('Invalid report format'),

  query('employeeId')
    .optional()
    .isInt()
    .withMessage('Invalid employee ID'),

  query('company')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),

  validateRequest
];

const validateReportGeneration = [
  param('reportId')
    .notEmpty()
    .withMessage('Report ID is required')
    .isUUID(4)
    .withMessage('Invalid report ID format'),

  validateRequest
];

module.exports = {
  validateReportQuery,
  validateReportGeneration
};
