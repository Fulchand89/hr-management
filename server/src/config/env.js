const path = require('path');
const dotenv = require('dotenv');

// Preserve pre-set NODE_ENV (such as 'test' from test runner)
const initialNodeEnv = process.env.NODE_ENV;
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
if (initialNodeEnv) {
  process.env.NODE_ENV = initialNodeEnv;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  APP_NAME: process.env.APP_NAME || 'HR Management Portal',
  APP_URL: process.env.APP_URL || 'http://localhost:5000',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  // Database
  DB: {
    DIALECT: process.env.DB_DIALECT || 'mysql',
    HOST: process.env.DB_HOST || '127.0.0.1',
    PORT: parseInt(process.env.DB_PORT, 10) || 3308,
    NAME: process.env.DB_NAME || 'hr_management_db',
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || '',
    LOGGING: process.env.DB_LOGGING === 'true',
    POOL: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    }
  },

  // JWT
  JWT: {
    SECRET: process.env.JWT_SECRET || 'hr_default_access_secret_key_2026',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'hr_default_refresh_secret_key_2026',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    RESET_PASSWORD_EXPIRES_IN: parseInt(process.env.RESET_PASSWORD_EXPIRES_IN, 10) || 3600000 // 1 hr
  },

  // SMTP Mailer
  SMTP: {
    HOST: process.env.SMTP_HOST || 'smtp.ethereal.email',
    PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
    SECURE: process.env.SMTP_SECURE === 'true',
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
    FROM: process.env.EMAIL_FROM || 'HR Management <no-reply@hrmanagement.com>'
  },

  // WebSockets
  WS_CORS_ORIGIN: process.env.WS_CORS_ORIGIN || '*',

  // Rate Limiter
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,
    AUTH_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20
  },

  // Cron
  CRON: {
    ENABLED: process.env.CRON_ENABLED !== 'false',
    ATTENDANCE_SCHEDULE: process.env.CRON_ATTENDANCE_SCHEDULE || '0 9 * * 1-5',
    LEAVE_ALERT_SCHEDULE: process.env.CRON_LEAVE_ALERT_SCHEDULE || '0 18 * * 1-5',
    CLEANUP_SCHEDULE: process.env.CRON_CLEANUP_SCHEDULE || '0 0 * * 0'
  },

  // Uploads
  UPLOAD: {
    DIR: process.env.UPLOAD_DIR || 'uploads',
    MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10
  }
};

module.exports = env;
