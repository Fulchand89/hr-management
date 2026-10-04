const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Department } = require('../src/models');
const { ROLES } = require('../src/constants/roles');

describe('Department Management API Tests (/api/v1/departments)', () => {
  let adminToken = '';
  let hrToken = '';
  let employeeToken = '';
  let testHODUser = null;
  let createdDeptId = '';

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // 1. Create Admin
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin.dept@example.com',
      password: 'AdminPassword@123',
      role: ROLES.ADMIN
    });
    adminToken = admin.generateAccessToken();

    // 2. Create HR
    const hr = await User.create({
      firstName: 'Sarah',
      lastName: 'HR',
      email: 'hr.dept@example.com',
      password: 'HrPassword@123',
      role: ROLES.HR
    });
    hrToken = hr.generateAccessToken();

    // 3. Create Regular Employee
    const employee = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.dept@example.com',
      password: 'EmployeePassword@123',
      role: ROLES.EMPLOYEE
    });
    employeeToken = employee.generateAccessToken();

    // 4. Create HOD User
    testHODUser = await User.create({
      firstName: 'Vikram',
      lastName: 'Singhania',
      email: 'vikram.hod@example.com',
      password: 'HodPassword@123',
      role: ROLES.MANAGER
    });
  });

  afterAll(async () => {
    // Teardown
  });

  describe('1. POST /api/v1/departments - Create Department', () => {
    it('should allow Admin to create a new department with Head of Department', async () => {
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Engineering & Technology',
          code: 'ENG',
          headId: testHODUser.id,
          description: 'Software development, cloud architecture, and QA operations.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Engineering & Technology');
      expect(res.body.data.code).toBe('ENG');
      expect(res.body.data.departmentHead).toBeDefined();
      expect(res.body.data.departmentHead.email).toBe('vikram.hod@example.com');
      createdDeptId = res.body.data.id;
    });

    it('should allow HR to create a department without HOD', async () => {
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          name: 'Human Resources',
          code: 'HR',
          description: 'Talent management and payroll operations.'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Human Resources');
    });

    it('should reject duplicate department name with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Engineering & Technology',
          code: 'ENG-NEW'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject duplicate department code with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Hardware Engineering',
          code: 'ENG'
        });

      expect(res.status).toBe(409);
    });

    it('should reject missing name with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'NO-NAME'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should forbid regular employee from creating department (403)', async () => {
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Unauthorized Dept',
          code: 'UNAUTH'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('2. GET /api/v1/departments - List Departments', () => {
    it('should return all departments with employeeCount and HOD', async () => {
      const res = await request(app)
        .get('/api/v1/departments')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data[0]).toHaveProperty('employeeCount');
    });

    it('should filter departments by search query', async () => {
      const res = await request(app)
        .get('/api/v1/departments?search=Engineering')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Engineering & Technology');
    });
  });

  describe('3. GET /api/v1/departments/:id - Get Single Department', () => {
    it('should return complete department details with members', async () => {
      const res = await request(app)
        .get(`/api/v1/departments/${createdDeptId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdDeptId);
      expect(res.body.data.name).toBe('Engineering & Technology');
      expect(res.body.data.departmentHead.email).toBe('vikram.hod@example.com');
    });

    it('should return 404 for non-existent department ID', async () => {
      const res = await request(app)
        .get('/api/v1/departments/00000000-0000-0000-0000-000000000099')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('4. PUT /api/v1/departments/:id - Update Department', () => {
    it('should allow HR/Admin to update department details', async () => {
      const res = await request(app)
        .put(`/api/v1/departments/${createdDeptId}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          description: 'Updated engineering division details.',
          status: 'active'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Updated engineering division details.');
    });

    it('should forbid regular employee from updating department (403)', async () => {
      const res = await request(app)
        .put(`/api/v1/departments/${createdDeptId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Hacked Name'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('5. DELETE /api/v1/departments/:id - Delete Department with Safety Rule', () => {
    let emptyDeptId = '';

    beforeAll(async () => {
      // Create empty temporary department
      const temp = await Department.create({
        name: 'Temporary Department',
        code: 'TEMP-DEL'
      });
      emptyDeptId = temp.id;

      // Assign an employee to the Engineering department to test safety protection
      const empToAssign = await User.create({
        firstName: 'Staff',
        lastName: 'Member',
        email: 'staff.eng@example.com',
        password: 'Password@123',
        departmentId: createdDeptId
      });
    });

    it('should block deletion of department with active employees (400 Bad Request)', async () => {
      const res = await request(app)
        .delete(`/api/v1/departments/${createdDeptId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('active employee(s)');
    });

    it('should allow Admin to delete an empty department', async () => {
      const res = await request(app)
        .delete(`/api/v1/departments/${emptyDeptId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it is gone
      const verify = await Department.findByPk(emptyDeptId);
      expect(verify).toBeNull();
    });

    it('should forbid HR from deleting department (Admin only)', async () => {
      const res = await request(app)
        .delete(`/api/v1/departments/${createdDeptId}`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(403);
    });
  });
});
