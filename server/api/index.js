// Serverless entrypoint for Vercel when deploying server directory
process.env.VERCEL = '1';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const app = require('../src/app');

module.exports = app;
