const winston = require('winston');
const { format } = winston;
const path = require('path');

// Custom format for log messages
const customFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Transport configuration
const transports = [
  // Console transport
  new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.printf(
        info => `${info.timestamp} ${info.level}: ${info.message}`
      )
    )
  }),

  // Error log file transport
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  }),

  // Combined log file transport
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  })
];

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format: customFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false
});

// Stream for Morgan HTTP logger
logger.stream = {
  write: message => logger.http(message.trim())
};

// Handle uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join('logs', 'exceptions.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  })
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (ex) => {
  throw ex;
});

// Log process events
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Give time for logging before exiting
  setTimeout(() => process.exit(1), 1000);
});

process.on('warning', (warning) => {
  logger.warn('Process Warning:', warning);
});

// Cleanup on exit
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Performing cleanup...');
  setTimeout(() => process.exit(0), 1000);
});

module.exports = logger;
