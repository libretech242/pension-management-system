module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    trustProxy: true, // Required for secure cookies behind a proxy
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  },

  // Database configuration
  database: {
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: {
      rejectUnauthorized: false // Required for some cloud providers
    }
  },

  // Redis configuration (for caching)
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true'
  },

  // JWT configuration
  jwt: {
    expiresIn: '8h',
    algorithm: 'HS256',
    issuer: 'pension-management-system'
  },

  // Logging configuration
  logging: {
    level: 'info',
    format: 'json',
    transports: ['file', 'console'],
    maxFiles: '14d', // Keep logs for 14 days
    maxSize: '20m' // 20MB max file size
  },

  // Email configuration
  email: {
    from: process.env.EMAIL_FROM,
    secure: true,
    pool: true,
    maxConnections: 5
  },

  // File upload configuration
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  },

  // Cache configuration
  cache: {
    ttl: 3600, // 1 hour
    checkPeriod: 600 // Check for expired cache entries every 10 minutes
  },

  // Security configuration
  security: {
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // requests per windowMs
    },
    sessionTimeout: 30 * 60 * 1000 // 30 minutes
  }
};
