const { body } = require('express-validator');
const { validateRequest } = require('./validateRequest');

const validateFileUpload = [
  body('file')
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('No file uploaded');
      }

      const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error('Invalid file type. Only CSV and Excel files are allowed');
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (req.file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 10MB');
      }

      return true;
    }),

  body('uploadType')
    .notEmpty()
    .withMessage('Upload type is required')
    .isIn(['contributions', 'employees', 'payroll'])
    .withMessage('Invalid upload type'),

  body('company')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),

  body('payPeriod')
    .optional()
    .isISO8601()
    .withMessage('Invalid pay period date format'),

  validateRequest
];

const validateBulkUploadStatus = [
  body('uploadId')
    .notEmpty()
    .withMessage('Upload ID is required')
    .isUUID(4)
    .withMessage('Invalid upload ID format'),

  validateRequest
];

module.exports = {
  validateFileUpload,
  validateBulkUploadStatus
};
