const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const routes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: env.CLIENT_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Gzip compression
app.use(compression());

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie Parser
app.use(cookieParser());

// HTTP Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve uploaded assets statically
app.use('/uploads', express.static(path.resolve(__dirname, '../', env.UPLOAD.DIR)));

// Apply General Rate Limiter to API
app.use('/api', apiLimiter);

// Welcome root endpoint
app.get('/', (req, res) => {
  res.json({
    name: env.APP_NAME,
    version: '1.0.0',
    documentation: '/api/v1/health',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      employees: '/api/v1/employees',
      roles: '/api/v1/roles',
      permissions: '/api/v1/permissions',
      designations: '/api/v1/designations',
      notifications: '/api/v1/notifications'
    }
  });
});

// Mount V1 API routes
app.use('/api/v1', routes);

// 404 Route Not Found Catch-All
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
