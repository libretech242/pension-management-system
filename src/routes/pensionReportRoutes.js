const express = require('express');
const { param, query } = require('express-validator');
const PensionReportController = require('../controllers/pensionReportController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();
const multer = require('multer');
const { validateDateRange } = require('../middleware/validation');
const logger = require('../utils/logger');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      logger.debug('File type accepted:', { mimetype: file.mimetype });
      cb(null, true);
    } else {
      logger.warn('Invalid file type rejected:', { mimetype: file.mimetype });
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'), false);
    }
  }
});

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
router.get(
  '/employee/:employeeId/contributions',
  validateEmployeeContributions,
  async (req, res, next) => {
    try {
      await PensionReportController.getEmployeeContributions(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Get contributions summary
router.get(
  '/summary',
  validateContributionsSummary,
  async (req, res, next) => {
    try {
      await PensionReportController.getContributionsSummary(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Generate reports
router.get(
  '/contributions/report',
  validateDateRange,
  async (req, res, next) => {
    try {
      await PensionReportController.generateContributionsReport(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/employee-summary',
  validateDateRange,
  async (req, res, next) => {
    try {
      await PensionReportController.generateEmployeeSummary(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Import data
router.post(
  '/import/contributions',
  upload.single('file'),
  async (req, res, next) => {
    try {
      await PensionReportController.importContributions(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/import/employees',
  upload.single('file'),
  async (req, res, next) => {
    try {
      await PensionReportController.importEmployees(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Export data
router.get(
  '/export/contributions',
  validateDateRange,
  async (req, res, next) => {
    try {
      await PensionReportController.exportContributions(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/export/employees',
  async (req, res, next) => {
    try {
      await PensionReportController.exportEmployees(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Cache management
router.post(
  '/employee/:employeeId/invalidate-cache',
  param('employeeId').isUUID().withMessage('Invalid employee ID'),
  async (req, res, next) => {
    try {
      await PensionReportController.invalidateEmployeeCache(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Get cache stats
router.get(
  '/cache/stats',
  async (req, res, next) => {
    try {
      await PensionReportController.getCacheStats(req, res);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
