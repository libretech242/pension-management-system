const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const cors = require('cors');
const xss = require('xss-clean');
const { logAuthEvent } = require('../utils/auditLogger');

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  handler: (req, res) => {
    logAuthEvent({
      userId: req.user?.id,
      action: 'RATE_LIMIT_EXCEEDED',
      success: false,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.'
    });
  }
});

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 600 // 10 minutes
};

// Security middleware setup
const setupSecurity = (app) => {
  // Basic security headers
  app.use(helmet());

  // CORS protection
  app.use(cors(corsOptions));

  // Rate limiting
  app.use('/api/', limiter);

  // Data sanitization against XSS
  app.use(xss());

  // Prevent parameter pollution
  app.use(hpp());

  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(['https://', req.get('Host'), req.url].join(''));
      }
      next();
    });
  }

  // Disable X-Powered-By header
  app.disable('x-powered-by');
};

module.exports = setupSecurity;
