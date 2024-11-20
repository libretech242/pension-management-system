const express = require('express');
const morgan = require('morgan');
const session = require('express-session');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const logger = require('./utils/logger');
const sequelize = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const swaggerSpec = require('./config/swagger');
const { securityMiddleware } = require('./middleware/security');

const app = express();
const isDevelopment = process.env.NODE_ENV === 'development';

// Apply security middleware
app.use(securityMiddleware);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Development-specific middleware
if (isDevelopment) {
  app.use(morgan('dev'));
  // Enable detailed error messages
  app.use((err, req, res, next) => {
    logger.error('Detailed error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
    next(err);
  });

  // Serve API documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Development homepage
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>Pension Management System - Development</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { color: #2c3e50; }
            .endpoints { background: #f8f9fa; padding: 20px; border-radius: 5px; }
            .endpoint { margin: 10px 0; }
            .method { display: inline-block; padding: 2px 6px; border-radius: 3px; color: white; font-size: 12px; }
            .get { background: #61affe; }
            .post { background: #49cc90; }
            .put { background: #fca130; }
            .delete { background: #f93e3e; }
          </style>
        </head>
        <body>
          <h1>Pension Management System API</h1>
          <p>Development Environment</p>
          <div class="endpoints">
            <h2>Available Endpoints:</h2>
            <div class="endpoint">
              <span class="method get">GET</span> /api/health - System health check
            </div>
            <div class="endpoint">
              <span class="method get">GET</span> /api-docs - API Documentation
            </div>
          </div>
          <p>For complete API documentation, visit <a href="/api-docs">/api-docs</a></p>
        </body>
      </html>
    `);
  });
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// Error handling
app.use(errorHandler.errorLogger);
app.use(errorHandler.errorHandler);
app.use(errorHandler.notFoundHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

module.exports = app;
