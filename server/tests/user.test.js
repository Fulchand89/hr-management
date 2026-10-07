const request = require('supertest');
const app = require('../src/app');
const { sequelize, User } = require('../src/models');
const { ROLES } = require('../src/constants/roles');

describe('User Management API Tests (RBAC & CRUD)', () => {
  let adminToken = '';
  let employeeToken = '';
  let createdUserId = '';

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Seed admin
    const admin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin.test@example.com',
      password: 'AdminPassword@123',
      role: ROLES.ADMIN,
      department: 'Executive'
    });
    adminToken = admin.generateAccessToken();

    // Seed regular employee
    const employee = await User.create({
      firstName: 'Bob',
      lastName: 'Employee',
      email: 'bob.test@example.com',
      password: 'BobPassword@123',
      role: ROLES.EMPLOYEE,
      department: 'Sales'
    });
    employeeToken = employee.generateAccessToken();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('GET /api/v1/users should be forbidden for regular employee', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/users should succeed for admin and return paginated users', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('page');
  });

  it('POST /api/v1/users should allow admin to create a new user', async () => {
    const newUser = {
      firstName: 'Clara',
      lastName: 'Oswald',
      email: 'clara.oswald@example.com',
      password: 'ClaraPassword@123',
      role: ROLES.HR,
      department: 'Human Resources',
      designation: 'Recruiter'
    };

    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(newUser.email.toLowerCase());
    expect(res.body.data.role).toBe(ROLES.HR);

    createdUserId = res.body.data.id;
  });

  it('PUT /api/v1/users/:id should allow admin to update user info', async () => {
    const res = await request(app)
      .put(`/api/v1/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ designation: 'Senior Recruiter', department: 'People Operations' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.designation).toBe('Senior Recruiter');
  });

  it('DELETE /api/v1/users/:id should allow admin to delete user', async () => {
    const res = await request(app)
      .delete(`/api/v1/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
