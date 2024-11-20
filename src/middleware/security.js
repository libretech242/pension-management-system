const helmet = require('helmet');
const csrf = require('csurf');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// CSRF protection (excluding API endpoints if needed)
const csrfProtection = csrf({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Security middleware configuration
const securityMiddleware = [
  // Basic security headers
  helmet(),
  
  // Rate limiting
  limiter,
  
  // Data sanitization against XSS
  xss(),
  
  // Data sanitization against NoSQL query injection
  mongoSanitize(),
  
  // Content security policy
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }),
  
  // Prevent clickjacking
  helmet.frameguard({ action: 'deny' }),
  
  // HTTP Strict Transport Security
  helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }),
  
  // Disable X-Powered-By header
  helmet.hidePoweredBy(),
  
  // Prevent MIME type sniffing
  helmet.noSniff(),
  
  // XSS protection
  helmet.xssFilter()
];

module.exports = {
  securityMiddleware,
  csrfProtection
};
