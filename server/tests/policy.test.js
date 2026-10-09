const request = require('supertest');
const app = require('../src/app');
const {
  sequelize,
  User,
  CompanyPolicy,
  PolicyAcknowledgment
} = require('../src/models');
const { ROLES } = require('../src/constants/roles');

describe('Company Policies & Compliance API Tests', () => {
  let hrToken = '';
  let employeeToken = '';
  let hrUser = null;
  let employeeUser = null;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test HR User
    hrUser = await User.create({
      firstName: 'HR',
      lastName: 'Manager',
      email: `hr.policy.${Date.now()}@example.com`,
      password: 'Password@123',
      role: ROLES.HR,
      department: 'Human Resources',
      status: 'active'
    });
    hrToken = hrUser.generateAccessToken();

    // Create test Employee User
    employeeUser = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: `emp.policy.${Date.now()}@example.com`,
      password: 'Password@123',
      role: ROLES.EMPLOYEE,
      department: 'Engineering',
      status: 'active'
    });
    employeeToken = employeeUser.generateAccessToken();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('1. GET /api/v1/policies should return auto-seeded company policies', async () => {
    const res = await request(app)
      .get('/api/v1/policies')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(5);

    const shiftPolicy = res.body.data.find((p) => p.policyCode === 'POL-GTW-01');
    expect(shiftPolicy).toBeDefined();
    expect(shiftPolicy.title).toContain('Office Timings');
    expect(shiftPolicy.isMandatory).toBe(true);
  });

  it('2. GET /api/v1/policies/:id should return single policy with acknowledgment status', async () => {
    const listRes = await request(app)
      .get('/api/v1/policies')
      .set('Authorization', `Bearer ${employeeToken}`);
    const policyId = listRes.body.data[0].id;

    const res = await request(app)
      .get(`/api/v1/policies/${policyId}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(policyId);
    expect(res.body.data).toHaveProperty('isAcknowledged');
  });

  it('3. POST /api/v1/policies/:id/acknowledge should allow employee to digitally sign policy', async () => {
    const listRes = await request(app)
      .get('/api/v1/policies')
      .set('Authorization', `Bearer ${employeeToken}`);
    const policy = listRes.body.data.find((p) => p.policyCode === 'POL-GTW-01');

    const res = await request(app)
      .post(`/api/v1/policies/${policy.id}/acknowledge`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ consentAgreed: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it now reflects as acknowledged
    const verifyRes = await request(app)
      .get(`/api/v1/policies/${policy.id}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(verifyRes.body.data.isAcknowledged).toBe(true);
    expect(verifyRes.body.data.acknowledgedAt).toBeDefined();
  });

  it('4. GET /api/v1/policies/:id/compliance should return compliance report for HR', async () => {
    const listRes = await request(app)
      .get('/api/v1/policies')
      .set('Authorization', `Bearer ${hrToken}`);
    const policy = listRes.body.data.find((p) => p.policyCode === 'POL-GTW-01');

    const res = await request(app)
      .get(`/api/v1/policies/${policy.id}/compliance`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.summary.acknowledgedCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.data.records)).toBe(true);
  });

  it('5. POST /api/v1/policies should allow HR to create a new company policy', async () => {
    const newPolicy = {
      title: 'Remote Work & WFH Guidelines 2026',
      policyCode: `POL-WFH-${Date.now().toString().slice(-4)}`,
      category: 'general',
      currentVersion: '1.0',
      isMandatory: true,
      effectiveDate: '2026-02-01',
      summary: 'Guidelines for eligible employees requesting remote work schedules.',
      content: 'Remote work requires prior managerial authorization and stable internet connection.'
    };

    const res = await request(app)
      .post('/api/v1/policies')
      .set('Authorization', `Bearer ${hrToken}`)
      .field('title', newPolicy.title)
      .field('policyCode', newPolicy.policyCode)
      .field('category', newPolicy.category)
      .field('currentVersion', newPolicy.currentVersion)
      .field('isMandatory', 'true')
      .field('effectiveDate', newPolicy.effectiveDate)
      .field('summary', newPolicy.summary)
      .field('content', newPolicy.content);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(newPolicy.title);
  });

  it('6. POST /api/v1/policies should forbid regular employee from creating policy', async () => {
    const res = await request(app)
      .post('/api/v1/policies')
      .set('Authorization', `Bearer ${employeeToken}`)
      .field('title', 'Unauthorized Policy');

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
