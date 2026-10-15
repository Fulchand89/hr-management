const env = require('./env');

/**
 * Validates whether an incoming origin is permitted by the application's CORS policy.
 * Supports:
 * - Requests with no origin (curl, mobile, Postman, server-to-server)
 * - Development environment (auto-permits all origins in dev mode)
 * - Localhost and 127.0.0.1 on any port
 * - Private LAN IPv4 ranges (192.168.x.x, 10.x.x.x, 172.16-31.x.x) on any port
 * - Configured origins from CLIENT_URL and WS_CORS_ORIGIN (single or comma-separated)
 * - Production and preview domains ending in .vercel.app
 *
 * @param {string|undefined} origin
 * @returns {boolean}
 */
const isOriginAllowed = (origin) => {
  // Allow requests without an origin header (e.g. mobile apps, curl, same-origin)
  if (!origin) {
    return true;
  }

  // Normalize origin by trimming whitespace and trailing slashes
  const cleanOrigin = origin.trim().replace(/\/+$/, '');

  // In non-production environments (development, test), allow any origin
  if (env.NODE_ENV !== 'production') {
    return true;
  }

  // Parse allowed origins configured in environment variables
  const configuredOrigins = [
    env.CLIENT_URL,
    process.env.CLIENT_URL,
    process.env.ALLOWED_ORIGINS,
    env.WS_CORS_ORIGIN,
    process.env.WS_CORS_ORIGIN
  ]
    .filter(Boolean)
    .flatMap((entry) => (typeof entry === 'string' ? entry.split(',') : []))
    .map((entry) => entry.trim().replace(/\/+$/, ''))
    .filter((entry) => entry && entry !== '*');

  if (configuredOrigins.includes(cleanOrigin)) {
    return true;
  }

  // Allow localhost & loopback on any port (http and https)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(cleanOrigin)) {
    return true;
  }

  // Allow Private LAN / Wi-Fi IP ranges on any port (e.g. http://192.168.1.10:5173):
  // 192.168.0.0 - 192.168.255.255
  // 10.0.0.0 - 10.255.255.255
  // 172.16.0.0 - 172.31.255.255
  if (
    /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/i.test(cleanOrigin) ||
    /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/i.test(cleanOrigin) ||
    /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/i.test(cleanOrigin)
  ) {
    return true;
  }

  // Allow Vercel preview and production deployments
  if (cleanOrigin.endsWith('.vercel.app')) {
    return true;
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Bypass-Tunnel-Reminder',
    'Accept'
  ]
};

module.exports = {
  isOriginAllowed,
  corsOptions
};
