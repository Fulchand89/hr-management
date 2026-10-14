// Vercel Serverless Function entry point (catch-all for all /api/* routes)
process.env.VERCEL = '1';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const app = require('../server/src/app');

module.exports = app;
