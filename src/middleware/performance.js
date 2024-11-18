const compression = require('compression');
const { createClient } = require('redis');
const logger = require('../utils/logger');

// Initialize Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: process.env.NODE_ENV === 'production',
    rejectUnauthorized: false
  }
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

redisClient.connect().catch(console.error);

// Compression middleware
const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Balanced between compression ratio and CPU usage
});

// Cache middleware
const cache = (duration) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedResponse = await redisClient.get(key);
      
      if (cachedResponse) {
        const data = JSON.parse(cachedResponse);
        return res.json(data);
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        if (res.statusCode === 200) {
          redisClient.setEx(key, duration, JSON.stringify(data))
            .catch(err => logger.error('Cache set error:', err));
        }
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

// Memory monitoring
const memoryMonitor = () => {
  const MB = 1024 * 1024;
  setInterval(() => {
    const memory = process.memoryUsage();
    logger.info('Memory usage:', {
      rss: `${Math.round(memory.rss / MB)}MB`,
      heapTotal: `${Math.round(memory.heapTotal / MB)}MB`,
      heapUsed: `${Math.round(memory.heapUsed / MB)}MB`,
      external: `${Math.round(memory.external / MB)}MB`
    });

    // Alert if memory usage is too high
    if (memory.heapUsed > 0.8 * memory.heapTotal) {
      logger.warn('High memory usage detected');
    }
  }, 300000); // Check every 5 minutes
};

// Database connection pool configuration
const dbPoolConfig = {
  max: 20, // Maximum number of connections
  min: 5, // Minimum number of connections
  idle: 10000, // Maximum time (ms) that a connection can be idle
  acquire: 30000, // Maximum time (ms) to acquire a connection
  evict: 60000, // Run cleanup every minute
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const time = diff[0] * 1e3 + diff[1] * 1e-6; // Convert to milliseconds

    logger.info('Request performance', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      time: `${time.toFixed(2)}ms`
    });

    // Alert on slow requests
    if (time > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        time: `${time.toFixed(2)}ms`
      });
    }
  });

  next();
};

// Clear expired cache entries
const cleanupCache = () => {
  setInterval(async () => {
    try {
      const keys = await redisClient.keys('cache:*');
      for (const key of keys) {
        const ttl = await redisClient.ttl(key);
        if (ttl <= 0) {
          await redisClient.del(key);
        }
      }
    } catch (error) {
      logger.error('Cache cleanup error:', error);
    }
  }, 3600000); // Run every hour
};

module.exports = {
  compressionMiddleware,
  cache,
  memoryMonitor,
  dbPoolConfig,
  performanceMonitor,
  cleanupCache,
  redisClient
};
