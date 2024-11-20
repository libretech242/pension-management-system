const { validateRequest } = require('./validateRequest');
const { validateEmployee } = require('./employeeValidation');
const {
  validatePensionContribution,
  validateDateRange,
  validatePensionId
} = require('./pensionValidation');
const {
  validateLogin,
  validateRegistration,
  validatePasswordReset,
  validatePasswordUpdate
} = require('./authValidation');
const {
  validatePayrollEntry,
  validatePayrollPeriod
} = require('./payrollValidation');
const {
  validateReportQuery,
  validateReportGeneration
} = require('./pensionReportValidation');
const {
  validateFileUpload,
  validateBulkUploadStatus
} = require('./pensionUploadValidation');

module.exports = {
  validateRequest,
  validateEmployee,
  validatePensionContribution,
  validateDateRange,
  validatePensionId,
  validateLogin,
  validateRegistration,
  validatePasswordReset,
  validatePasswordUpdate,
  validatePayrollEntry,
  validatePayrollPeriod,
  validateReportQuery,
  validateReportGeneration,
  validateFileUpload,
  validateBulkUploadStatus
};
