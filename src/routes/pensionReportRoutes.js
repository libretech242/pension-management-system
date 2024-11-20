const express = require('express');
const { param, query } = require('express-validator');
const PensionReportController = require('../controllers/pensionReportController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();
const upload = require('../middleware/fileUpload');
const { validateDateRange } = require('../middleware/validation');
const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');

// Validation middleware
const validateEmployeeContributions = [
  param('employeeId').isUUID().withMessage('Invalid employee ID'),
  query('startDate').isISO8601().withMessage('Invalid start date'),
  query('endDate').isISO8601().withMessage('Invalid end date')
];

const validateContributionsSummary = [
  query('year').isInt({ min: 2000, max: 2100 }).withMessage('Invalid year'),
  query('month').isInt({ min: 1, max: 12 }).withMessage('Invalid month')
];

// Protected routes (require authentication)
router.use(authenticateToken);

// Get employee contributions
router.get('/employee/:employeeId/contributions', validateEmployeeContributions, async (req, res, next) => {
  try {
    const result = await PensionReportController.getEmployeeContributions(req);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
});

// Get contributions summary
router.get('/summary', validateContributionsSummary, async (req, res, next) => {
  try {
    const result = await PensionReportController.getContributionsSummary(req);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
});

// Generate reports
router.get('/contributions/report', validateDateRange, async (req, res, next) => {
  try {
    const result = await PensionReportController.generateContributionsReport(req);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
});

router.get('/employee-summary', validateDateRange, async (req, res, next) => {
  try {
    const result = await PensionReportController.generateEmployeeSummary(req);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
});

// Import data
router.post('/import/contributions', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json(ApiResponse.error('No file uploaded'));
    }
    const result = await PensionReportController.importContributions(req);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
});

router.post('/import/employees', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json(ApiResponse.error('No file uploaded'));
    }
    const result = await PensionReportController.importEmployees(req);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
});

// Export data
router.get('/export/contributions', validateDateRange, async (req, res, next) => {
  try {
    const result = await PensionReportController.exportContributions(req);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
});

router.get('/export/employees', async (req, res, next) => {
  try {
    const result = await PensionReportController.exportEmployees(req);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
});

// Cache management
router.post('/employee/:employeeId/invalidate-cache', param('employeeId').isUUID().withMessage('Invalid employee ID'), async (req, res, next) => {
  try {
    const result = await PensionReportController.invalidateEmployeeCache(req);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
});

// Get cache stats
router.get('/cache/stats', async (req, res, next) => {
  try {
    const result = await PensionReportController.getCacheStats(req);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
router.use((err, req, res, next) => {
  logger.error('Pension report error:', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json(ApiResponse.error(
    process.env.NODE_ENV === 'development' ? err.message : 'An error occurred processing the pension report'
  ));
});

module.exports = router;
