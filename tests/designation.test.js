const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Department, Designation } = require('../src/models');
const { ROLES } = require('../src/constants/roles');

describe('Designation Management API Tests (/api/v1/designations)', () => {
  let adminToken = '';
  let hrToken = '';
  let employeeToken = '';
  let managerToken = '';
  let testDept = null;
  let createdDesigId = '';
  let assignedDesigId = '';
  let testEmployeeUser = null;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // 1. Create Admin
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin.desig@example.com',
      password: 'AdminPassword@123',
      role: ROLES.ADMIN
    });
    adminToken = admin.generateAccessToken();

    // 2. Create HR
    const hr = await User.create({
      firstName: 'Sarah',
      lastName: 'HR',
      email: 'hr.desig@example.com',
      password: 'HrPassword@123',
      role: ROLES.HR
    });
    hrToken = hr.generateAccessToken();

    // 3. Create Manager
    const manager = await User.create({
      firstName: 'Mike',
      lastName: 'Manager',
      email: 'manager.desig@example.com',
      password: 'ManagerPassword@123',
      role: ROLES.MANAGER
    });
    managerToken = manager.generateAccessToken();

    // 4. Create Regular Employee
    const employee = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.desig@example.com',
      password: 'EmployeePassword@123',
      role: ROLES.EMPLOYEE
    });
    employeeToken = employee.generateAccessToken();
    testEmployeeUser = employee;

    // 5. Create Test Department
    testDept = await Department.create({
      name: 'Technology & Product',
      code: 'TECH'
    });
  });

  describe('1. POST /api/v1/designations - Create Designation', () => {
    it('should allow Admin to create a new designation with full details', async () => {
      const res = await request(app)
        .post('/api/v1/designations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Senior Software Engineer',
          code: 'SSE-001',
          departmentId: testDept.id,
          description: 'Lead technical implementation and architecture design.',
          minSalary: 80000,
          maxSalary: 140000,
          level: 'senior',
          status: 'active'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Senior Software Engineer');
      expect(res.body.data.code).toBe('SSE-001');
      expect(res.body.data.departmentDetails).toBeDefined();
      expect(res.body.data.departmentDetails.name).toBe('Technology & Product');
      expect(res.body.data.level).toBe('senior');
      createdDesigId = res.body.data.id;
    });

    it('should allow HR to create a designation with auto-generated code', async () => {
      const res = await request(app)
        .post('/api/v1/designations')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          title: 'Quality Assurance Specialist',
          description: 'Automated test suite maintenance.',
          minSalary: 50000,
          maxSalary: 90000,
          level: 'mid'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Quality Assurance Specialist');
      expect(res.body.data.code).toBeDefined();
      expect(res.body.data.code.startsWith('DES-')).toBe(true);
    });

    it('should reject duplicate title with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/designations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Senior Software Engineer',
          code: 'ANOTHER-CODE'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject duplicate code with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/designations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Staff Architect',
          code: 'SSE-001'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject minSalary greater than maxSalary with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/designations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalid Salary Role',
          minSalary: 120000,
          maxSalary: 60000
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should forbid standard employee from creating designation (403)', async () => {
      const res = await request(app)
        .post('/api/v1/designations')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          title: 'Unauthorized Designation'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('2. GET /api/v1/designations - List Designations', () => {
    it('should return all designations for authenticated users', async () => {
      const res = await request(app)
        .get('/api/v1/designations')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should support search query', async () => {
      const res = await request(app)
        .get('/api/v1/designations?search=Quality')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Quality Assurance Specialist');
    });

    it('should support pagination metadata', async () => {
      const res = await request(app)
        .get('/api/v1/designations?paginate=true&page=1&limit=1')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.currentPage).toBe(1);
      expect(res.body.meta.limit).toBe(1);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('3. GET /api/v1/designations/stats - Statistics & Breakdown', () => {
    it('should return aggregated stats for Admin', async () => {
      const res = await request(app)
        .get('/api/v1/designations/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalDesignations).toBeGreaterThanOrEqual(2);
      expect(res.body.data.levelBreakdown).toBeDefined();
    });

    it('should allow HR to access stats', async () => {
      const res = await request(app)
        .get('/api/v1/designations/stats')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
    });

    it('should forbid standard employee from accessing stats (403)', async () => {
      const res = await request(app)
        .get('/api/v1/designations/stats')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('4. GET /api/v1/designations/:id - Single Designation', () => {
    it('should fetch designation by ID with department details', async () => {
      const res = await request(app)
        .get(`/api/v1/designations/${createdDesigId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdDesigId);
      expect(res.body.data.title).toBe('Senior Software Engineer');
      expect(res.body.data.departmentDetails).toBeDefined();
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await request(app)
        .get('/api/v1/designations/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('5. PUT /api/v1/designations/:id - Update Designation', () => {
    it('should allow Admin to update designation fields', async () => {
      const res = await request(app)
        .put(`/api/v1/designations/${createdDesigId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Lead Software Architect',
          minSalary: 95000,
          maxSalary: 160000,
          level: 'lead'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Lead Software Architect');
      expect(res.body.data.level).toBe('lead');
    });

    it('should reject salary range conflict on update (min > max)', async () => {
      const res = await request(app)
        .put(`/api/v1/designations/${createdDesigId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          minSalary: 200000,
          maxSalary: 100000
        });

      expect(res.status).toBe(400);
    });
  });

  describe('6. PATCH /api/v1/designations/:id/status - Status Toggle', () => {
    it('should toggle status to inactive', async () => {
      const res = await request(app)
        .patch(`/api/v1/designations/${createdDesigId}/status`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ status: 'inactive' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('inactive');
    });

    it('should toggle status back to active', async () => {
      const res = await request(app)
        .patch(`/api/v1/designations/${createdDesigId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');
    });
  });

  describe('7. GET /api/v1/designations/:id/employees - List Assigned Employees', () => {
    beforeAll(async () => {
      // Assign test employee to created designation
      testEmployeeUser.designationId = createdDesigId;
      await testEmployeeUser.save();
    });

    it('should return employees holding this designation', async () => {
      const res = await request(app)
        .get(`/api/v1/designations/${createdDesigId}/employees`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].email).toBe('john.desig@example.com');
      expect(res.body.meta.designation.title).toBe('Lead Software Architect');
    });
  });

  describe('8. DELETE /api/v1/designations/:id - Safe Deletion', () => {
    let unassignedDesigId = '';

    beforeAll(async () => {
      // Create a designation with no employees
      const unassigned = await Designation.create({
        title: 'Temporary Intern Role',
        code: 'INTERN-TEMP',
        status: 'active'
      });
      unassignedDesigId = unassigned.id;
    });

    it('should block deletion if employees are assigned (400)', async () => {
      const res = await request(app)
        .delete(`/api/v1/designations/${createdDesigId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot delete designation');
    });

    it('should forbid HR from deleting designation (Admin only)', async () => {
      const res = await request(app)
        .delete(`/api/v1/designations/${unassignedDesigId}`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow Admin to delete unassigned designation', async () => {
      const res = await request(app)
        .delete(`/api/v1/designations/${unassignedDesigId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deletion
      const check = await Designation.findByPk(unassignedDesigId);
      expect(check).toBeNull();
    });
  });
});
