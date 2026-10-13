// Vercel Serverless Function entry point
process.env.VERCEL = process.env.VERCEL || '1';

const app = require('../server/src/app');

module.exports = app;
