const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
const EventEmitter = require('events');

// Increase max listeners globally for database connections
EventEmitter.defaultMaxListeners = 15;

// Environment-specific configuration
const env = process.env.NODE_ENV || 'development';
const isDevelopment = env === 'development';

// Base configuration
const baseConfig = {
  dialect: 'postgres',
  logging: isDevelopment ? (msg) => logger.debug(msg) : false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true
  }
};

// Environment-specific configurations
const config = {
  development: {
    ...baseConfig,
    url: process.env.DATABASE_URL
  },
  test: {
    ...baseConfig,
    url: process.env.DATABASE_URL,
    database: 'pensionprodb',
    schema: 'test',
    logging: false,
    pool: {
      max: 2,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    ...baseConfig,
    url: process.env.DATABASE_URL,
    logging: false,
    pool: {
      max: 10,
      min: 2
    }
  }
};

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  logger.error('Required environment variable DATABASE_URL is not set');
  process.exit(1);
}

// Create Sequelize instance based on environment
const envConfig = config[env];
const sequelize = new Sequelize(envConfig.url, envConfig);

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    if (isDevelopment) {
      logger.debug('Database configuration:', {
        host: new URL(process.env.DATABASE_URL).hostname,
        dialect: baseConfig.dialect,
        ssl: !!baseConfig.dialectOptions.ssl,
        poolConfig: baseConfig.pool
      });
    }
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    throw error;
  }
}

// Initialize connection
if (env !== 'test') {
  testConnection()
    .catch(error => {
      logger.error('Fatal database connection error:', error);
      process.exit(1);
    });
}

module.exports = sequelize;
