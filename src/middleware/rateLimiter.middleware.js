const rateLimit = require('express-rate-limit');
const env = require('../config/env');

/**
 * Standard API Rate Limiter
 */
const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT.WINDOW_MS,
  max: env.RATE_LIMIT.MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests created from this IP, please try again after 15 minutes.'
  }
});

/**
 * Strict Auth Rate Limiter (Protects login / register / forgot-password against brute-force)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.RATE_LIMIT.AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
