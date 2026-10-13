// Vercel Serverless Function entry point
process.env.VERCEL = '1';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const app = require('../server/src/app');

module.exports = app;
