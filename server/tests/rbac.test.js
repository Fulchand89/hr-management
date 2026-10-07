const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Role, Permission, UserPermission } = require('../src/models');
const { ROLES } = require('../src/constants/roles');

describe('RBAC & Permissions System Tests', () => {
  let adminToken = '';
  let employeeToken = '';
  let testAdminUser = null;
  let testEmployeeUser = null;
  let createdRoleId = '';
  let createdPermId = '';

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // 1. Create Roles
    const adminRole = await Role.create({
      name: ROLES.ADMIN,
      displayName: 'System Administrator',
      isSystem: true
    });

    const employeeRole = await Role.create({
      name: ROLES.EMPLOYEE,
      displayName: 'Standard Employee',
      isSystem: true
    });

    // 2. Create Permissions
    const permRead = await Permission.create({
      name: 'users:read',
      displayName: 'Read Users',
      module: 'users'
    });

    const permDelete = await Permission.create({
      name: 'users:delete',
      displayName: 'Delete Users',
      module: 'users'
    });

    // 3. Assign permissions to Admin role
    await adminRole.setPermissions([permRead, permDelete]);

    // 4. Create Users
    testAdminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin.rbac@example.com',
      password: 'AdminPassword@123',
      role: ROLES.ADMIN,
      roleId: adminRole.id,
      department: 'Executive'
    });
    adminToken = testAdminUser.generateAccessToken();

    testEmployeeUser = await User.create({
      firstName: 'Emp',
      lastName: 'User',
      email: 'emp.rbac@example.com',
      password: 'EmpPassword@123',
      role: ROLES.EMPLOYEE,
      roleId: employeeRole.id,
      department: 'IT'
    });
    employeeToken = testEmployeeUser.generateAccessToken();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ==========================================
  // ROLES API
  // ==========================================
  describe('Roles API Endpoints', () => {
    it('GET /api/v1/roles should return all roles with permissions', async () => {
      const res = await request(app)
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('POST /api/v1/roles should create a new custom role', async () => {
      const res = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'project_lead',
          displayName: 'Project Lead',
          description: 'Team leader role'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('project_lead');
      createdRoleId = res.body.data.id;
    });

    it('PUT /api/v1/roles/:id should update role details', async () => {
      const res = await request(app)
        .put(`/api/v1/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          displayName: 'Senior Project Lead'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.displayName).toBe('Senior Project Lead');
    });

    it('POST /api/v1/roles should be forbidden for regular employee', async () => {
      const res = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'hacker',
          displayName: 'Hacker Role'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  // ==========================================
  // PERMISSIONS API
  // ==========================================
  describe('Permissions API Endpoints', () => {
    it('GET /api/v1/permissions should return permissions list', async () => {
      const res = await request(app)
        .get('/api/v1/permissions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('POST /api/v1/permissions should create new permission', async () => {
      const res = await request(app)
        .post('/api/v1/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'audit:export',
          displayName: 'Export Audit Logs',
          module: 'audit',
          description: 'Allows exporting audit logs'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.name).toBe('audit:export');
      createdPermId = res.body.data.id;
    });

    it('PUT /api/v1/roles/:id/permissions should assign permission to role', async () => {
      const res = await request(app)
        .put(`/api/v1/roles/${createdRoleId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          permissionIds: [createdPermId]
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.permissions.some((p) => p.id === createdPermId)).toBe(true);
    });
  });

  // ==========================================
  // USER PERMISSIONS API (DIRECT ASSIGNMENT)
  // ==========================================
  describe('Direct User Permissions', () => {
    it('POST /api/v1/users/:id/permissions should assign direct permission to user', async () => {
      const res = await request(app)
        .post(`/api/v1/users/${testEmployeeUser.id}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          permissions: [createdPermId]
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.effectivePermissions).toContain('audit:export');
    });

    it('GET /api/v1/users/:id/permissions should return effective and direct permissions', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${testEmployeeUser.id}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.effectivePermissions).toContain('audit:export');
      expect(res.body.data.directPermissions.length).toBe(1);
    });

    it('DELETE /api/v1/users/:id/permissions/:permissionId should revoke direct permission', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${testEmployeeUser.id}/permissions/${createdPermId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);

      // Verify removed from effective
      const effective = await testEmployeeUser.getEffectivePermissions();
      expect(effective).not.toContain('audit:export');
    });
  });

  // ==========================================
  // MODEL HELPER METHODS
  // ==========================================
  describe('Model Methods (hasPermission & hasAnyPermission)', () => {
    it('Admin user hasPermission should always return true', async () => {
      const hasPerm = await testAdminUser.hasPermission('any:nonexistent:perm');
      expect(hasPerm).toBe(true);
    });

    it('Employee user hasPermission should verify effective permissions', async () => {
      const hasBefore = await testEmployeeUser.hasPermission('users:read');
      expect(hasBefore).toBe(false);

      // Assign direct permission
      const permRead = await Permission.findOne({ where: { name: 'users:read' } });
      await UserPermission.create({
        userId: testEmployeeUser.id,
        permissionId: permRead.id,
        granted: true
      });

      const hasAfter = await testEmployeeUser.hasPermission('users:read');
      expect(hasAfter).toBe(true);
    });
  });
});
