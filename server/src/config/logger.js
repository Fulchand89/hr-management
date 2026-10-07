/**
 * Production-ready formatted logger
 */
const logger = {
  info: (message, meta = '') => {
    console.log(`\x1b[36m[INFO]\x1b[0m [${new Date().toISOString()}] ${message}`, meta ? meta : '');
  },
  success: (message, meta = '') => {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m [${new Date().toISOString()}] ${message}`, meta ? meta : '');
  },
  warn: (message, meta = '') => {
    console.warn(`\x1b[33m[WARN]\x1b[0m [${new Date().toISOString()}] ${message}`, meta ? meta : '');
  },
  error: (message, error = '') => {
    console.error(`\x1b[31m[ERROR]\x1b[0m [${new Date().toISOString()}] ${message}`, error ? error : '');
  },
  debug: (message, meta = '') => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\x1b[35m[DEBUG]\x1b[0m [${new Date().toISOString()}] ${message}`, meta ? meta : '');
    }
  }
};

module.exports = logger;
