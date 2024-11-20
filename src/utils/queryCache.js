const NodeCache = require('node-cache');
const crypto = require('crypto');
const logger = require('./logger');

class QueryCache {
  constructor(ttlSeconds = 3600) { // Default TTL: 1 hour
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds * 0.2,
      useClones: false
    });

    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0
    };
  }

  generateKey(query, params = {}) {
    // Create a unique key based on the query and parameters
    const data = JSON.stringify({ query, params });
    return crypto.createHash('md5').update(data).digest('hex');
  }

  async get(query, params = {}) {
    const key = this.generateKey(query, params);
    const value = this.cache.get(key);

    if (value) {
      this.stats.hits++;
      logger.debug('Cache hit', { key });
      return value;
    }

    this.stats.misses++;
    logger.debug('Cache miss', { key });
    return null;
  }

  async set(query, params = {}, value, ttl = null) {
    const key = this.generateKey(query, params);
    
    try {
      const success = this.cache.set(key, value, ttl);
      if (success) {
        this.stats.keys = this.cache.keys().length;
        logger.debug('Cache set successful', { key });
      }
      return success;
    } catch (error) {
      logger.error('Error setting cache', { error, key });
      return false;
    }
  }

  async invalidate(query, params = {}) {
    const key = this.generateKey(query, params);
    
    try {
      this.cache.del(key);
      this.stats.keys = this.cache.keys().length;
      logger.debug('Cache invalidated', { key });
      return true;
    } catch (error) {
      logger.error('Error invalidating cache', { error, key });
      return false;
    }
  }

  async invalidatePattern(pattern) {
    try {
      const keys = this.cache.keys();
      const invalidatedKeys = keys.filter(key => key.includes(pattern));
      
      invalidatedKeys.forEach(key => {
        this.cache.del(key);
      });

      this.stats.keys = this.cache.keys().length;
      logger.debug('Cache pattern invalidated', { pattern, invalidatedKeys });
      return invalidatedKeys.length;
    } catch (error) {
      logger.error('Error invalidating cache pattern', { error, pattern });
      return 0;
    }
  }

  async clear() {
    try {
      this.cache.flushAll();
      this.stats.keys = 0;
      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error('Error clearing cache', { error });
      return false;
    }
  }

  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      memoryUsage: this.cache.getStats()
    };
  }

  async wrap(query, params = {}, fetchFunction, ttl = null) {
    let result = await this.get(query, params);

    if (!result) {
      result = await fetchFunction();
      await this.set(query, params, result, ttl);
    }

    return result;
  }
}

// Create a singleton instance
const queryCache = new QueryCache();

module.exports = queryCache;
