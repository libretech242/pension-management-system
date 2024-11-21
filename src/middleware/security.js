const helmet = require('helmet');
const csrf = require('csurf');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

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

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'development' 
    ? ['http://localhost:3000', 'http://localhost:5000'] 
    : process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Security middleware configuration
const securityMiddleware = [
  cors(corsOptions),
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'http://localhost:5000', 'http://localhost:3000'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }),
  xss(),
  mongoSanitize(),
  limiter
];

module.exports = {
  securityMiddleware,
  csrfProtection
};
