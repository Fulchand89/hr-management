const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Department, Designation, Branch, Shift, Attendance, LeaveType } = require('../src/models');
const { ROLES } = require('../src/constants/roles');
const { USER_STATUS } = require('../src/constants/status');

describe('Employee Management API Tests (6 Endpoints)', () => {
  let adminToken = '';
  let employeeToken = '';
  let hrToken = '';
  let testDeptId = '';
  let testDesigId = '';
  let testBranchId = '';
  let testManagerId = '';
  let createdEmployeeId = '';

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // 1. Create Admin
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'Leader',
      email: 'admin.emp@example.com',
      password: 'AdminPassword@123',
      role: ROLES.ADMIN,
      department: 'Executive'
    });
    adminToken = admin.generateAccessToken();

    // 2. Create HR
    const hr = await User.create({
      firstName: 'Sarah',
      lastName: 'HR',
      email: 'sarah.hr@example.com',
      password: 'HrPassword@123',
      role: ROLES.HR,
      department: 'Human Resources'
    });
    hrToken = hr.generateAccessToken();

    // 3. Create Manager
    const manager = await User.create({
      firstName: 'Mark',
      lastName: 'Manager',
      email: 'mark.mgr@example.com',
      password: 'ManagerPassword@123',
      role: ROLES.MANAGER,
      department: 'Engineering'
    });
    testManagerId = manager.id;

    // 4. Create regular Employee
    const regularEmp = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'UserPassword@123',
      role: ROLES.EMPLOYEE,
      department: 'Engineering'
    });
    employeeToken = regularEmp.generateAccessToken();

    // 5. Create supporting master data
    const dept = await Department.create({
      name: 'Technology',
      code: 'TECH',
      description: 'Tech and IT'
    });
    testDeptId = dept.id;

    const desig = await Designation.create({
      title: 'Senior Software Engineer',
      code: 'SSE-01',
      department: 'Technology',
      level: 3
    });
    testDesigId = desig.id;

    const branch = await Branch.create({
      name: 'Headquarters',
      code: 'HQ-01',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India'
    });
    testBranchId = branch.id;

    const shift = await Shift.create({
      name: 'General Day Shift',
      code: 'SH-GEN',
      startTime: '09:00:00',
      endTime: '18:00:00',
      isDefault: true
    });

    await LeaveType.create({
      name: 'Casual Leave',
      code: 'CL',
      daysAllowedPerYear: 12,
      isPaid: true
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('1. POST /api/v1/employees - Register Employee', () => {
    it('should reject employee creation if requested by regular employee (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          firstName: 'Unauthorized',
          lastName: 'Guy',
          email: 'unauth@example.com'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should fail validation when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          firstName: 'A'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail validation if employee age is under 18 years', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() - 15); // 15 years old

      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          firstName: 'Under',
          lastName: 'Age',
          email: 'underage@example.com',
          dob: futureDate.toISOString().split('T')[0]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should successfully register a new employee with valid data', async () => {
      const validDob = new Date();
      validDob.setFullYear(validDob.getFullYear() - 25);

      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          firstName: 'Michael',
          lastName: 'Scott',
          email: 'michael.scott@example.com',
          employeeCode: 'EMP-0101',
          phone: '+91 9876543210',
          departmentId: testDeptId,
          designationId: testDesigId,
          branchId: testBranchId,
          managerId: testManagerId,
          salary: 85000.0,
          dob: validDob.toISOString().split('T')[0],
          gender: 'male',
          joiningDate: '2026-01-15'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.employeeCode).toBe('EMP-0101');
      expect(res.body.data.email).toBe('michael.scott@example.com');
      expect(res.body.data.department).toBe('Technology');
      expect(res.body.data.designation).toBe('Senior Software Engineer');

      createdEmployeeId = res.body.data.id;
    });

    it('should reject registration if email is duplicate', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          firstName: 'Clone',
          lastName: 'Scott',
          email: 'michael.scott@example.com'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. GET /api/v1/employees - List Employees with Filters & Search', () => {
    it('should return paginated employee list with relations for HR', async () => {
      const res = await request(app)
        .get('/api/v1/employees?page=1&limit=5')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('should filter employees by search query', async () => {
      const res = await request(app)
        .get('/api/v1/employees?search=Michael')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].firstName).toBe('Michael');
    });

    it('should filter employees by status', async () => {
      const res = await request(app)
        .get('/api/v1/employees?status=active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.every((e) => e.status === 'active')).toBe(true);
    });
  });

  describe('3. GET /api/v1/employees/:id - 360 Degree Profile View', () => {
    it('should return complete 360 profile including department, branch, manager and leave balances', async () => {
      const res = await request(app)
        .get(`/api/v1/employees/${createdEmployeeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdEmployeeId);
      expect(res.body.data).toHaveProperty('departmentDetails');
      expect(res.body.data).toHaveProperty('designationDetails');
      expect(res.body.data).toHaveProperty('branchDetails');
      expect(res.body.data).toHaveProperty('manager');
      expect(res.body.data.manager.id).toBe(testManagerId);
      expect(res.body.data).toHaveProperty('leaveBalances');
      expect(Array.isArray(res.body.data.leaveBalances)).toBe(true);
    });

    it('should return 404 for non-existent employee ID', async () => {
      const res = await request(app)
        .get('/api/v1/employees/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. PUT /api/v1/employees/:id - Update Employee Details', () => {
    it('should reject update if employee sets themselves as manager', async () => {
      const res = await request(app)
        .put(`/api/v1/employees/${createdEmployeeId}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          managerId: createdEmployeeId
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('cannot be designated as their own reporting manager');
    });

    it('should successfully update employee fields', async () => {
      const res = await request(app)
        .put(`/api/v1/employees/${createdEmployeeId}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          firstName: 'Mike',
          salary: 95000.0,
          phone: '+91 9998887776'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('Mike');
      expect(Number(res.body.data.salary)).toBe(95000);
    });
  });

  describe('5. PATCH /api/v1/employees/:id/status - Status Change Workflow', () => {
    it('should require a reason when suspending or terminating an employee', async () => {
      const res = await request(app)
        .patch(`/api/v1/employees/${createdEmployeeId}/status`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          status: USER_STATUS.SUSPENDED
          // Missing required reason
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Validation error');
    });

    it('should successfully change status to suspended with reason', async () => {
      const res = await request(app)
        .patch(`/api/v1/employees/${createdEmployeeId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: USER_STATUS.SUSPENDED,
          reason: 'Internal security audit investigation underway'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStatus).toBe(USER_STATUS.SUSPENDED);
      expect(res.body.data.sessionTerminated).toBe(true);
    });

    it('should reject setting the same status again', async () => {
      const res = await request(app)
        .patch(`/api/v1/employees/${createdEmployeeId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: USER_STATUS.SUSPENDED,
          reason: 'Redundant change'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('already in');
    });

    it('should reactivate the employee status back to active', async () => {
      const res = await request(app)
        .patch(`/api/v1/employees/${createdEmployeeId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: USER_STATUS.ACTIVE,
          reason: 'Cleared in investigation'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.currentStatus).toBe(USER_STATUS.ACTIVE);
    });
  });

  describe('6. GET /api/v1/employees/:id/status - Real-Time Pulse Check', () => {
    it('should return real-time working pulse (not_clocked_in)', async () => {
      const res = await request(app)
        .get(`/api/v1/employees/${createdEmployeeId}/status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('realTimePulse');
      expect(res.body.data.realTimePulse).toBe('not_clocked_in');
      expect(res.body.data.isClockedIn).toBe(false);
      expect(res.body.data.employee.isAccountActive).toBe(true);
    });

    it('should reflect clocked_in status when attendance is marked today', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Insert clock-in record for today
      await Attendance.create({
        userId: createdEmployeeId,
        date: today,
        clockIn: new Date(),
        status: 'present'
      });

      const res = await request(app)
        .get(`/api/v1/employees/${createdEmployeeId}/status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.realTimePulse).toBe('clocked_in');
      expect(res.body.data.isClockedIn).toBe(true);
      expect(res.body.data.attendanceToday).not.toBeNull();
      expect(res.body.data.attendanceToday.clockIn).toBeTruthy();
    });
  });
});
