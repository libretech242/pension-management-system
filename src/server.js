require('dotenv').config();
const https = require('https');
const fs = require('fs');
const winston = require('winston');
const app = require('./app');

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Use port 5000 for the API server in development
const PORT = process.env.NODE_ENV === 'production'
  ? process.env.PORT || 443  // HTTPS by default for production
  : process.env.PORT || 5000; // Use 5000 in development to avoid conflict with React's 3000

// Start server with appropriate configuration
const startServer = async () => {
  try {
    // In production with HTTPS
    if (process.env.NODE_ENV === 'production' && !process.env.DISABLE_HTTPS) {
      const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8');
      const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
      const credentials = { key: privateKey, cert: certificate };
      
      https.createServer(credentials, app).listen(PORT, () => {
        logger.info(`HTTPS Server running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
      });
    } 
    // Development or HTTPS disabled
    else {
      app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
      });
    }
  } catch (error) {
    logger.error('Server startup failed:', error);
    process.exit(1);
  }
};

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

startServer();
