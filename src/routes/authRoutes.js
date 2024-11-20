const express = require('express');
const jwt = require('jsonwebtoken');
const AuthController = require('../controllers/authController');
const { validateLoginRequest } = require('../middleware/loginValidation');
const validatePasswordReset = require('../middleware/passwordResetValidation');
const RateLimitService = require('../services/rateLimitService');
const logger = require('../utils/logger');

console.log('Importing authRoutes');

// Create router instance
const router = express.Router();

console.log('Router creation method:', {
  method: 'express.Router()',
  constructorName: router.constructor.name,
  constructorSource: router.constructor.toString()
});

// Diagnostic function to check router type
function checkRouterType(router) {
  console.log('Detailed Router Type Checks:', {
    instanceOfRouter: router instanceof express.Router,
    instanceOfRouterConstructor: router instanceof router.constructor,
    routerType: typeof router,
    constructorName: router.constructor.name,
    prototypeChain: Object.getPrototypeOf(router),
    hasRouterMethods: !!(
      router.get && 
      router.post && 
      router.put && 
      router.delete && 
      router.use
    )
  });
}

// Immediate type check
checkRouterType(router);

// Initialize rate limiter for login attempts
const loginRateLimiter = new RateLimitService({
  maxAttempts: process.env.NODE_ENV === 'development' ? 10 : 5,
  windowMinutes: process.env.NODE_ENV === 'development' ? 1 : 15
});

// Create rate limit middleware for login route
const loginRateLimit = loginRateLimiter.createMiddleware(
  (req) => `${req.ip}:${req.body.email?.toLowerCase()}`
);

console.log('Middleware checks:');
console.log('loginRateLimit:', typeof loginRateLimit);
console.log('validateLoginRequest:', typeof validateLoginRequest);
console.log('validatePasswordReset:', typeof validatePasswordReset);
console.log('AuthController.login:', typeof AuthController.login);

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

// Test route for debugging
router.get('/test', (req, res) => {
  console.log('Test route accessed');
  res.json({ message: 'Auth routes are working' });
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
router.post('/login', [loginRateLimit, validateLoginRequest], async (req, res, next) => {
  try {
    await AuthController.login(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    await AuthController.register(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/forgot-password', validateLoginRequest, async (req, res, next) => {
  try {
    await AuthController.forgotPassword(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/reset-password', validatePasswordReset, async (req, res, next) => {
  try {
    await AuthController.resetPassword(req, res);
  } catch (error) {
    next(error);
  }
});

// Protected routes
router.use(verifyToken);

router.post('/logout', async (req, res, next) => {
  try {
    await AuthController.logout(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/profile', async (req, res, next) => {
  try {
    await AuthController.getProfileDetails(req, res);
  } catch (error) {
    next(error);
  }
});

router.put('/profile', async (req, res, next) => {
  try {
    await AuthController.updateProfile(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/change-password', async (req, res, next) => {
  try {
    await AuthController.changePassword(req, res);
  } catch (error) {
    next(error);
  }
});

// Admin routes
router.use(isAdmin);

router.get('/users', async (req, res, next) => {
  try {
    await AuthController.listUsers(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/audit-logs', async (req, res, next) => {
  try {
    await AuthController.getAuditLogs(req, res);
  } catch (error) {
    next(error);
  }
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

// Log all routes for debugging
const routes = [];
router.stack.forEach(layer => {
  if (layer.route) {
    routes.push({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods)
    });
  } else {
    routes.push({
      path: 'Unknown',
      methods: []
    });
  }
});
console.log('Router stack:', routes);

// Explicitly log router details
console.log('Router stack:', router.stack.map(layer => ({
  path: layer.route ? layer.route.path : 'Unknown',
  methods: layer.route ? Object.keys(layer.route.methods) : []
})));

// Final router type check
checkRouterType(router);

// Verify export
module.exports = router;
console.log('Router exported successfully');
