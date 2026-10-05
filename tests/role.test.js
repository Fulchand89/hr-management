const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Role, Permission } = require('../src/models');
const { ROLES } = require('../src/constants/roles');

describe('Role Management API Comprehensive Tests (/api/v1/roles)', () => {
  let adminToken = '';
  let hrToken = '';
  let employeeToken = '';
  let adminRole = null;
  let employeeRole = null;
  let testAdmin = null;
  let testHr = null;
  let testEmployee = null;
  let testPermission1 = null;
  let testPermission2 = null;
  let createdRoleId = '';

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // 1. Create Default Roles
    adminRole = await Role.create({
      name: ROLES.ADMIN,
      displayName: 'System Administrator',
      isSystem: true
    });

    const hrRole = await Role.create({
      name: ROLES.HR,
      displayName: 'HR Manager',
      isSystem: true
    });

    employeeRole = await Role.create({
      name: ROLES.EMPLOYEE,
      displayName: 'Standard Employee',
      isSystem: true
    });

    // 2. Create Permissions
    testPermission1 = await Permission.create({
      name: 'reports:view',
      displayName: 'View Reports',
      module: 'reports'
    });

    testPermission2 = await Permission.create({
      name: 'reports:export',
      displayName: 'Export Reports',
      module: 'reports'
    });

    // 3. Create Users
    testAdmin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin.role@example.com',
      password: 'AdminPassword@123',
      role: ROLES.ADMIN,
      roleId: adminRole.id
    });
    adminToken = testAdmin.generateAccessToken();

    testHr = await User.create({
      firstName: 'HR',
      lastName: 'User',
      email: 'hr.role@example.com',
      password: 'HrPassword@123',
      role: ROLES.HR,
      roleId: hrRole.id
    });
    hrToken = testHr.generateAccessToken();

    testEmployee = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'employee.role@example.com',
      password: 'EmployeePassword@123',
      role: ROLES.EMPLOYEE,
      roleId: employeeRole.id
    });
    employeeToken = testEmployee.generateAccessToken();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ==========================================
  // 1. POST /api/v1/roles - Create Role
  // ==========================================
  describe('1. POST /api/v1/roles - Create Role', () => {
    it('should allow Admin to create a new custom role with permissions', async () => {
      const res = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'team_lead',
          displayName: 'Team Lead',
          description: 'Technical lead for engineering squads',
          permissionIds: [testPermission1.id]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('team_lead');
      expect(res.body.data.displayName).toBe('Team Lead');
      expect(res.body.data.isSystem).toBe(false);
      expect(res.body.data.permissions.length).toBe(1);
      expect(res.body.data.permissions[0].name).toBe('reports:view');
      createdRoleId = res.body.data.id;
    });

    it('should reject duplicate role name with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'team_lead',
          displayName: 'Another Team Lead'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should forbid HR from creating role (Admin only - 403)', async () => {
      const res = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          name: 'qa_lead',
          displayName: 'QA Lead'
        });

      expect(res.status).toBe(403);
    });

    it('should forbid regular employee from creating role (403)', async () => {
      const res = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'hacker',
          displayName: 'Hacker Role'
        });

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // 2. GET /api/v1/roles - List All Roles
  // ==========================================
  describe('2. GET /api/v1/roles - List Roles', () => {
    it('should allow Admin to list all roles with their permissions', async () => {
      const res = await request(app)
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4); // admin, hr, employee, team_lead
    });

    it('should allow HR to list roles', async () => {
      const res = await request(app)
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should forbid regular employee from listing roles (403)', async () => {
      const res = await request(app)
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // 3. GET /api/v1/roles/:id - Single Role Details
  // ==========================================
  describe('3. GET /api/v1/roles/:id - Single Role Details', () => {
    it('should return role details with permissions and users', async () => {
      const res = await request(app)
        .get(`/api/v1/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdRoleId);
      expect(res.body.data.name).toBe('team_lead');
      expect(res.body.data.permissions).toBeDefined();
      expect(res.body.data.users).toBeDefined();
    });

    it('should return 404 for non-existent role ID', async () => {
      const res = await request(app)
        .get('/api/v1/roles/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // 4. GET /api/v1/roles/:id/users - Users Assigned to Role
  // ==========================================
  describe('4. GET /api/v1/roles/:id/users - Users in Role', () => {
    it('should return users assigned to employee role', async () => {
      const res = await request(app)
        .get(`/api/v1/roles/${employeeRole.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].email).toBe('employee.role@example.com');
      expect(res.body.meta.role.name).toBe(ROLES.EMPLOYEE);
    });

    it('should return empty list for newly created unassigned role', async () => {
      const res = await request(app)
        .get(`/api/v1/roles/${createdRoleId}/users`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
      expect(res.body.meta.totalUsers).toBe(0);
    });
  });

  // ==========================================
  // 5. PUT /api/v1/roles/:id - Update Role
  // ==========================================
  describe('5. PUT /api/v1/roles/:id - Update Role', () => {
    it('should allow Admin to update role display name and description', async () => {
      const res = await request(app)
        .put(`/api/v1/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          displayName: 'Principal Team Lead',
          description: 'Updated squad leader role description'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.displayName).toBe('Principal Team Lead');
      expect(res.body.data.description).toBe('Updated squad leader role description');
    });

    it('should reject renaming a system role (400)', async () => {
      const res = await request(app)
        .put(`/api/v1/roles/${adminRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'super_admin'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('System roles cannot be renamed');
    });
  });

  // ==========================================
  // 6. PUT /api/v1/roles/:id/permissions - Assign Permissions
  // ==========================================
  describe('6. PUT /api/v1/roles/:id/permissions - Assign Role Permissions', () => {
    it('should update role permissions', async () => {
      const res = await request(app)
        .put(`/api/v1/roles/${createdRoleId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          permissionIds: [testPermission1.id, testPermission2.id]
        });

      expect(res.status).toBe(200);
      expect(res.body.data.permissions.length).toBe(2);
      const permNames = res.body.data.permissions.map((p) => p.name);
      expect(permNames).toContain('reports:view');
      expect(permNames).toContain('reports:export');
    });
  });

  // ==========================================
  // 7. DELETE /api/v1/roles/:id - Delete Role
  // ==========================================
  describe('7. DELETE /api/v1/roles/:id - Delete Role', () => {
    it('should block deletion of system roles (400 Bad Request)', async () => {
      const res = await request(app)
        .delete(`/api/v1/roles/${adminRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Default system roles cannot be deleted');
    });

    it('should block deletion if role has assigned users (400 Bad Request)', async () => {
      const res = await request(app)
        .delete(`/api/v1/roles/${employeeRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('should forbid HR from deleting custom role (Admin only - 403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow Admin to delete unassigned custom role', async () => {
      const res = await request(app)
        .delete(`/api/v1/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deletion from database
      const check = await Role.findByPk(createdRoleId);
      expect(check).toBeNull();
    });
  });
});
