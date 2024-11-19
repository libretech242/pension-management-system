const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/authController');
const { validateLogin, validateRegistration, validatePasswordChange } = require('../middleware/validation');

// Public routes
router.post('/login', validateLogin, authController.login);
router.post('/register', validateRegistration, authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes (require authentication)
router.use(authenticateToken);
router.get('/profile', authController.getProfile);
router.put('/change-password', validatePasswordChange, authController.changePassword);
router.put('/update-profile', authController.updateProfile);
router.post('/logout', authController.logout);

// Admin only routes
router.get('/users', authController.listUsers);
router.get('/audit-logs', authController.getAuditLogs);

module.exports = router;
