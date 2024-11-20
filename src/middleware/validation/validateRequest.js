const { validationResult } = require('express-validator');
const ApiResponse = require('../../utils/apiResponse');

/**
 * Middleware to handle validation results
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(
      ApiResponse.error('Validation failed', 400, {
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
          value: err.value
        }))
      })
    );
  }
  next();
};

module.exports = {
  validateRequest
};
