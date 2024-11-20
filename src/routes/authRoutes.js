const express = require('express');
const jwt = require('jsonwebtoken');
const AuthController = require('../controllers/authController');
const { validateLoginRequest } = require('../middleware/loginValidation');
const validatePasswordReset = require('../middleware/passwordResetValidation');
const RateLimitService = require('../services/rateLimitService');
const logger = require('../utils/logger');

// Create router instance
const router = express.Router();

// Initialize rate limiter for login attempts
const loginRateLimiter = new RateLimitService({
  maxAttempts: process.env.NODE_ENV === 'development' ? 10 : 5,
  windowMinutes: process.env.NODE_ENV === 'development' ? 1 : 15
});

// Create rate limit middleware for login route
const loginRateLimit = loginRateLimiter.createMiddleware(
  (req) => `${req.ip}:${req.body.email?.toLowerCase()}`
);

// Verify controller methods exist
const requiredMethods = [
  'login',
  'register',
  'forgotPassword',
  'resetPassword',
  'getProfileDetails',
  'changePassword',
  'updateProfile',
  'logout',
  'listUsers',
  'getAuditLogs'
];

requiredMethods.forEach(method => {
  if (typeof AuthController[method] !== 'function') {
    logger.error(`Missing or invalid controller method: ${method}`);
    throw new Error(`Controller method ${method} is not properly defined`);
  }
});

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or expired token'
    });
  }
};

// Admin role check middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access Denied',
      message: 'Admin privileges required'
    });
  }
  next();
};

// Public routes
router.post('/login', [loginRateLimit, validateLoginRequest], (req, res, next) => {
  AuthController.login(req, res).catch(next);
});

router.post('/register', (req, res, next) => {
  AuthController.register(req, res).catch(next);
});

router.post('/forgot-password', validateLoginRequest, (req, res, next) => {
  AuthController.forgotPassword(req, res).catch(next);
});

router.post('/reset-password', validatePasswordReset, (req, res, next) => {
  AuthController.resetPassword(req, res).catch(next);
});

// Protected routes
router.use(verifyToken);

router.post('/logout', (req, res, next) => {
  AuthController.logout(req, res).catch(next);
});

router.get('/profile', (req, res, next) => {
  AuthController.getProfileDetails(req, res).catch(next);
});

router.put('/profile', (req, res, next) => {
  AuthController.updateProfile(req, res).catch(next);
});

router.post('/change-password', (req, res, next) => {
  AuthController.changePassword(req, res).catch(next);
});

// Admin routes
router.use(isAdmin);

router.get('/users', (req, res, next) => {
  AuthController.listUsers(req, res).catch(next);
});

router.get('/audit-logs', (req, res, next) => {
  AuthController.getAuditLogs(req, res).catch(next);
});

// Error handling middleware
router.use((err, req, res, next) => {
  logger.error('Auth route error:', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: 'Auth Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Export the router
module.exports = router;
