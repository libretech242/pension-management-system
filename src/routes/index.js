const express = require('express');
const logger = require('../utils/logger');

// Create main router
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const employeeRoutes = require('./employeeRoutes');
const payrollRoutes = require('./payrollRoutes');
const pensionRoutes = require('./pensionRoutes');
const pensionReportRoutes = require('./pensionReportRoutes');
const pensionUploadRoutes = require('./pensionUploadRoutes');
const reportRoutes = require('./reportRoutes');

// Log route registration
logger.debug('Registering routes:', {
    availableRoutes: ['auth', 'employees', 'payroll', 'pension', 'pension-reports', 'pension-uploads', 'reports'],
    timestamp: new Date().toISOString()
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/payroll', payrollRoutes);
router.use('/pension', pensionRoutes);
router.use('/pension-reports', pensionReportRoutes);
router.use('/pension-uploads', pensionUploadRoutes);
router.use('/reports', reportRoutes);

// Health check route
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// 404 handler
router.use((req, res) => {
    logger.warn('Route not found:', {
        method: req.method,
        path: req.path,
        ip: req.ip
    });
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found'
    });
});

// Error handler
router.use((err, req, res, next) => {
    logger.error('Route error:', {
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method
    });

    res.status(err.status || 500).json({
        error: 'Server Error',
        message: process.env.NODE_ENV === 'development' 
            ? err.message 
            : 'An unexpected error occurred'
    });
});

module.exports = router;
