const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Shift, Attendance } = require('../src/models');
const { ROLES } = require('../src/constants/roles');

describe('Attendance API Integration Tests (/api/v1/attendance)', () => {
  let adminToken = '';
  let employeeToken = '';
  let employeeUser = null;
  let testShift = null;
  let attendanceRecordId = '';

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // 1. Create Shift
    testShift = await Shift.create({
      name: 'Standard Morning Shift',
      startTime: '09:00',
      endTime: '18:00',
      graceMinutes: 15,
      status: 'active'
    });

    // 2. Create Admin
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'WorkPulse',
      email: 'admin.att@workpulse.io',
      password: 'AdminPassword@123',
      role: ROLES.ADMIN
    });
    adminToken = admin.generateAccessToken();

    // 3. Create Employee
    employeeUser = await User.create({
      firstName: 'Aarav',
      lastName: 'Sharma',
      email: 'aarav.att@workpulse.io',
      password: 'EmployeePassword@123',
      employeeCode: 'EMP-9001',
      role: ROLES.EMPLOYEE
    });
    employeeToken = employeeUser.generateAccessToken();
  });

  describe('1. GET /api/v1/attendance/today', () => {
    it('should return 401 if access token is missing', async () => {
      const res = await request(app).get('/api/v1/attendance/today');
      expect(res.status).toBe(401);
    });

    it('should return initial NOT_PUNCHED_IN status before clocking in', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/today')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('NOT_PUNCHED_IN');
      expect(res.body.data.workingSeconds).toBe(0);
      expect(res.body.data.progress).toBe(0);
    });
  });

  describe('2. POST /api/v1/attendance/punch-in', () => {
    it('should successfully clock in and return WORKING status', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/punch-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          remarks: 'Working from Bangalore Headquarters',
          shiftId: testShift.id
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('WORKING');
      expect(res.body.data.timeline.length).toBeGreaterThan(0);
      expect(res.body.data.timeline[0].label).toBe('Punch In');
      expect(res.body.data.attendanceId).toBeDefined();

      attendanceRecordId = res.body.data.attendanceId;
    });

    it('should reject a duplicate punch-in on the same day', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/punch-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ remarks: 'Second punch attempt' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already punched in/i);
    });
  });

  describe('3. POST /api/v1/attendance/break-start', () => {
    it('should transition status to ON_BREAK', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/break-start')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ reason: 'Lunch Break' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ON_BREAK');
      expect(res.body.data.timeline.some((t) => t.label === 'Lunch Break')).toBe(true);
    });

    it('should reject starting another break while already on break', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/break-start')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ reason: 'Second break' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already on an active break/i);
    });
  });

  describe('4. POST /api/v1/attendance/break-end', () => {
    it('should resume work and transition status back to WORKING', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/break-end')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('WORKING');
      expect(res.body.data.timeline.some((t) => t.label === 'Break Ended')).toBe(true);
    });

    it('should reject ending break when not on active break', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/break-end')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/do not have an active break/i);
    });
  });

  describe('5. POST /api/v1/attendance/punch-out', () => {
    it('should successfully clock out and transition status to PUNCHED_OUT', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/punch-out')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ remarks: 'Completed all sprint tasks' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PUNCHED_OUT');
      expect(res.body.data.clockOutTime).toBeDefined();
      expect(res.body.data.timeline.some((t) => t.label === 'Punch Out')).toBe(true);
    });

    it('should reject a duplicate punch-out', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/punch-out')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ remarks: 'Duplicate checkout' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already punched out/i);
    });
  });

  describe('6. GET /api/v1/attendance/my-history', () => {
    it('should retrieve monthly attendance summary and history records', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/my-history')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.records.length).toBeGreaterThan(0);
      expect(res.body.data.records[0].date).toBeDefined();
    });
  });

  describe('7. Admin Attendance Endpoints', () => {
    it('should allow Admin to fetch daily roster', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/admin/daily')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should forbid regular employee from accessing admin daily roster', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/admin/daily')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow Admin to regularize attendance record', async () => {
      const res = await request(app)
        .put(`/api/v1/attendance/admin/regularize/${attendanceRecordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'present',
          totalHours: 8.5,
          remarks: 'Manager approved 8.5 hours override'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(parseFloat(res.body.data.totalHours)).toBe(8.5);
    });
  });
});
