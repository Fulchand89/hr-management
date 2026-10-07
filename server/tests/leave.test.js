const request = require('supertest');
const app = require('../src/app');
const {
  sequelize,
  User,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  Holiday
} = require('../src/models');
const { ROLES } = require('../src/constants/roles');

describe('Leave Management API Integration Tests (/api/v1/leaves)', () => {
  let adminToken = '';
  let hrToken = '';
  let employeeToken = '';
  let employeeUser = null;
  let testLeaveType = null;
  let createdLeaveRequestId = '';

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // 1. Create Admin
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'WorkPulse',
      email: 'admin.leave@workpulse.io',
      password: 'AdminPassword@123',
      role: ROLES.ADMIN
    });
    adminToken = admin.generateAccessToken();

    // 2. Create HR
    const hr = await User.create({
      firstName: 'Helen',
      lastName: 'Rivers',
      email: 'hr.leave@workpulse.io',
      password: 'HrPassword@123',
      role: ROLES.HR
    });
    hrToken = hr.generateAccessToken();

    // 3. Create Employee
    employeeUser = await User.create({
      firstName: 'Rohan',
      lastName: 'Verma',
      email: 'rohan.leave@workpulse.io',
      password: 'EmployeePassword@123',
      employeeCode: 'EMP-7001',
      role: ROLES.EMPLOYEE
    });
    employeeToken = employeeUser.generateAccessToken();

    // 4. Create Initial Leave Type
    testLeaveType = await LeaveType.create({
      name: 'Casual Leave',
      code: 'CL',
      daysPerYear: 12,
      isCarryForward: false,
      isPaid: true,
      description: 'Standard casual personal leave'
    });

    // 5. Seed Balance for Employee
    await LeaveBalance.create({
      userId: employeeUser.id,
      leaveTypeId: testLeaveType.id,
      year: 2026,
      allocated: 12.0,
      used: 0.0,
      remaining: 12.0
    });
  });

  describe('1. LEAVE TYPES (/api/v1/leaves/types)', () => {
    it('should return 401 if access token is missing', async () => {
      const res = await request(app).get('/api/v1/leaves/types');
      expect(res.status).toBe(401);
    });

    it('should allow authenticated users to fetch all leave types', async () => {
      const res = await request(app)
        .get('/api/v1/leaves/types')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].code).toBe('CL');
    });

    it('should allow Admin to create a new leave type', async () => {
      const res = await request(app)
        .post('/api/v1/leaves/types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sick Leave',
          code: 'SL',
          daysPerYear: 10,
          isCarryForward: true,
          isPaid: true,
          description: 'Medical recuperation leave'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('SL');
      expect(res.body.data.daysPerYear).toBe(10);
    });

    it('should forbid standard Employee from creating a leave type', async () => {
      const res = await request(app)
        .post('/api/v1/leaves/types')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Unauthorized Leave',
          code: 'UL',
          daysPerYear: 5
        });

      expect(res.status).toBe(403);
    });

    it('should reject creating duplicate leave type code', async () => {
      const res = await request(app)
        .post('/api/v1/leaves/types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Another Casual Leave',
          code: 'CL',
          daysPerYear: 15
        });

      expect(res.status).toBe(409);
    });
  });

  describe('2. LEAVE BALANCES (/api/v1/leaves/my-balances)', () => {
    it('should return employee personal leave balances and quota summary', async () => {
      const res = await request(app)
        .get('/api/v1/leaves/my-balances')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.totalAllocated).toBeGreaterThanOrEqual(12);
    });

    it('should allow HR/Admin to allocate or adjust leave balance', async () => {
      const res = await request(app)
        .post('/api/v1/leaves/balances/allocate')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          userId: employeeUser.id,
          leaveTypeId: testLeaveType.id,
          allocated: 15,
          year: 2026
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Number(res.body.data.allocated)).toBe(15);
      expect(Number(res.body.data.remaining)).toBe(15);
    });
  });

  describe('3. LEAVE APPLICATIONS (EMPLOYEE)', () => {
    it('should successfully submit a leave application when balance is sufficient', async () => {
      const res = await request(app)
        .post('/api/v1/leaves/apply')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: testLeaveType.id,
          startDate: '2026-11-10',
          endDate: '2026-11-12',
          totalDays: 2.0,
          reason: 'Attending sister wedding ceremony in Jaipur'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.startDate).toBe('2026-11-10');
      expect(Number(res.body.data.totalDays)).toBe(2);

      createdLeaveRequestId = res.body.data.id;
    });

    it('should reject overlapping leave application for the same dates', async () => {
      const res = await request(app)
        .post('/api/v1/leaves/apply')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: testLeaveType.id,
          startDate: '2026-11-11',
          endDate: '2026-11-13',
          totalDays: 2.0,
          reason: 'Conflicting leave dates request'
        });

      expect(res.status).toBe(409);
    });

    it('should reject application if requested days exceed available quota', async () => {
      const res = await request(app)
        .post('/api/v1/leaves/apply')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: testLeaveType.id,
          startDate: '2026-12-01',
          endDate: '2026-12-25',
          totalDays: 50.0,
          reason: 'Exorbitant leave request'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Insufficient leave balance/i);
    });

    it('should return employee my-requests history', async () => {
      const res = await request(app)
        .get('/api/v1/leaves/my-requests')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('should allow employee to cancel their pending leave request', async () => {
      // First apply for a separate one-day leave to cancel
      const applyRes = await request(app)
        .post('/api/v1/leaves/apply')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: testLeaveType.id,
          startDate: '2026-11-20',
          endDate: '2026-11-20',
          totalDays: 1.0,
          reason: 'Dentist appointment checkup'
        });

      const cancelId = applyRes.body.data.id;

      const cancelRes = await request(app)
        .put(`/api/v1/leaves/cancel/${cancelId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.success).toBe(true);
      expect(cancelRes.body.data.status).toBe('cancelled');
    });
  });

  describe('4. ADMIN & MANAGER APPROVALS (/api/v1/leaves/admin)', () => {
    it('should allow Admin/HR to view all employee leave applications', async () => {
      const res = await request(app)
        .get('/api/v1/leaves/admin/requests')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.summary).toBeDefined();
      expect(res.body.meta.summary.pending).toBeGreaterThanOrEqual(1);
    });

    it('should forbid standard employee from accessing admin requests list', async () => {
      const res = await request(app)
        .get('/api/v1/leaves/admin/requests')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should approve leave request, update status to approved, and deduct balance', async () => {
      const res = await request(app)
        .patch(`/api/v1/leaves/admin/action/${createdLeaveRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'approved',
          actionReason: 'Approved as adequate team coverage is in place.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');
      expect(res.body.data.actionReason).toBe('Approved as adequate team coverage is in place.');

      // Verify balance deduction
      const balanceRes = await request(app)
        .get('/api/v1/leaves/my-balances')
        .set('Authorization', `Bearer ${employeeToken}`);

      const clBalance = balanceRes.body.data.find((b) => b.leaveTypeId === testLeaveType.id);
      expect(Number(clBalance.used)).toBe(2.0);
      expect(Number(clBalance.remaining)).toBe(13.0); // 15 allocated - 2 used = 13
    });

    it('should reject already actioned leave request if attempted again', async () => {
      const res = await request(app)
        .patch(`/api/v1/leaves/admin/action/${createdLeaveRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'rejected',
          actionReason: 'Cannot re-action'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already marked as approved/i);
    });
  });

  describe('5. HOLIDAYS (/api/v1/leaves/holidays)', () => {
    let createdHolidayId = '';

    it('should allow Admin to create a new holiday', async () => {
      const res = await request(app)
        .post('/api/v1/leaves/holidays')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Diwali Festival of Lights',
          date: '2026-11-08',
          type: 'gazetted',
          description: 'Company-wide holiday'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Diwali Festival of Lights');
      createdHolidayId = res.body.data.id;
    });

    it('should allow authenticated users to view holidays list', async () => {
      const res = await request(app)
        .get('/api/v1/leaves/holidays?year=2026')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((h) => h.date === '2026-11-08')).toBe(true);
    });

    it('should allow Admin to delete a holiday', async () => {
      const res = await request(app)
        .delete(`/api/v1/leaves/holidays/${createdHolidayId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
