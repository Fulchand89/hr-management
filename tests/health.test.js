const request = require('supertest');
const app = require('../src/app');

describe('Health & Root API Tests', () => {
  it('GET / should return application information', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('endpoints');
  });

  it('GET /api/v1/health should return healthy status and database info', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body).toHaveProperty('database');
  });

  it('GET /unknown-route should return 404', async () => {
    const res = await request(app).get('/api/v1/non-existent-route-xyz');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
