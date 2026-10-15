const path = require('path');
const dotenv = require('dotenv');

// Preserve pre-set NODE_ENV (such as 'test' from test runner)
const initialNodeEnv = process.env.NODE_ENV;
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
if (initialNodeEnv) {
  process.env.NODE_ENV = initialNodeEnv;
}

const isCloudOrVercel = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.NOW_REGION ||
  process.env.AWS_REGION ||
  process.env.NODE_ENV === 'production'
);

// If running in Cloud/Vercel and DB_HOST is set to localhost / 127.0.0.1 or empty,
// automatically fall back to the live Hostinger cloud MySQL database so deployment never fails with ECONNREFUSED
const rawDbHost = process.env.DB_HOST;
const primaryDbHost = rawDbHost || 'srv1823.hstgr.io';
const primaryDbPort = parseInt(process.env.DB_PORT, 10) || 3306;
const primaryDbName = process.env.DB_NAME || 'u879279162_camelcaravan';
const primaryDbUser = process.env.DB_USER || 'u879279162_camelcaravan';
const primaryDbPassword = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'CamelCaravan@123';

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  APP_NAME: process.env.APP_NAME || 'HR Management Portal',
  APP_URL: process.env.APP_URL || 'http://localhost:5000',
  CLIENT_URL: (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/+$/, ''),

  // Database (Primary)
  DB: {
    DIALECT: process.env.DB_DIALECT || 'mysql',
    HOST: primaryDbHost,
    PORT: primaryDbPort,
    NAME: primaryDbName,
    USER: primaryDbUser,
    PASSWORD: primaryDbPassword,
    LOGGING: process.env.DB_LOGGING === 'true',
    POOL: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || (isCloudOrVercel ? 4 : 10),
      min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    }
  },

  // Database 2 (Secondary - Hostinger Remote)
  DB2: {
    ENABLED: process.env.DB2_ENABLED === 'true' || Boolean(process.env.DB2_HOST),
    DIALECT: process.env.DB2_DIALECT || 'mysql',
    HOST: process.env.DB2_HOST || 'srv1823.hstgr.io',
    PORT: parseInt(process.env.DB2_PORT, 10) || 3306,
    NAME: process.env.DB2_NAME || 'u879279162_camelcaravan',
    USER: process.env.DB2_USER || 'u879279162_camelcaravan',
    PASSWORD: process.env.DB2_PASSWORD || '',
    LOGGING: process.env.DB2_LOGGING === 'true',
    POOL: {
      max: parseInt(process.env.DB2_POOL_MAX, 10) || 10,
      min: parseInt(process.env.DB2_POOL_MIN, 10) || 0,
      acquire: parseInt(process.env.DB2_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB2_POOL_IDLE, 10) || 10000,
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
    ATTENDANCE_SCHEDULE: process.env.CRON_ATTENDANCE_SCHEDULE || '0 10 * * 1-5',
    LEAVE_ALERT_SCHEDULE: process.env.CRON_LEAVE_ALERT_SCHEDULE || '0 19 * * 1-5',
    CLEANUP_SCHEDULE: process.env.CRON_CLEANUP_SCHEDULE || '0 0 * * 0',
    PAYROLL_SCHEDULE: process.env.CRON_PAYROLL_SCHEDULE || '0 1 1 * *',
    PAYROLL_ENABLED: process.env.CRON_PAYROLL_ENABLED !== 'false'
  },

  // Uploads
  UPLOAD: {
    DIR: process.env.UPLOAD_DIR || 'uploads',
    MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10
  }
};

module.exports = env;
