const logger = require('../utils/logger');

class RateLimitService {
  constructor(options = {}) {
    this.attempts = new Map();
    this.options = {
      maxAttempts: process.env.NODE_ENV === 'development' ? 10 : 5,
      windowMinutes: process.env.NODE_ENV === 'development' ? 1 : 15,
      ...options
    };
  }

  getAttempts(key) {
    if (!this.attempts.has(key)) {
      this.attempts.set(key, {
        count: 0,
        firstAttempt: Date.now(),
        lastAttempt: Date.now()
      });
    }
    return this.attempts.get(key);
  }

  increment(key) {
    const attempt = this.getAttempts(key);
    attempt.count += 1;
    attempt.lastAttempt = Date.now();
    return attempt.count;
  }

  reset(key) {
    this.attempts.delete(key);
  }

  isLimited(key) {
    const attempt = this.getAttempts(key);
    
    // Reset if window has expired
    if (Date.now() - attempt.firstAttempt > this.options.windowMinutes * 60 * 1000) {
      this.reset(key);
      return false;
    }

    return attempt.count >= this.options.maxAttempts;
  }

  createMiddleware(keyFn = (req) => req.ip) {
    return (req, res, next) => {
      const key = keyFn(req);
      
      if (this.isLimited(key)) {
        logger.warn('Rate limit exceeded:', {
          key,
          attempts: this.getAttempts(key).count,
          ip: req.ip,
          path: req.path
        });

        return res.status(429).json({
          error: 'Too Many Attempts',
          message: process.env.NODE_ENV === 'development'
            ? `Too many attempts. Please wait ${this.options.windowMinutes} minute(s) before trying again.`
            : 'Too many attempts. Please try again later.',
          retryAfter: `${this.options.windowMinutes} minutes`
        });
      }

      // Attach rate limit info to request
      req.rateLimit = {
        increment: () => this.increment(key),
        reset: () => this.reset(key),
        attempts: this.getAttempts(key).count
      };

      next();
    };
  }
}

module.exports = RateLimitService;
