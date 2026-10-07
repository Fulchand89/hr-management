const request = require('supertest');
const app = require('./src/app');
const { closeConnection } = require('./src/config/db');

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Starting Comprehensive HR Panel Backend API Tests');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${extraInfo}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await request(app).get('/api/v1/health');
    assert(healthRes.status === 200 && healthRes.body.database === 'connected', 'Health Check (Database Connected)');

    // 2. Auth: Login as HR
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'hr@hrmanagement.com', password: 'HrPassword@123' });
    
    const hrToken = loginRes.body.data?.accessToken;
    const hrUserId = loginRes.body.data?.user?.id;
    assert(loginRes.status === 200 && Boolean(hrToken), 'HR Login Authentication');

    if (!hrToken) {
      console.log('Login Response Body:', loginRes.body);
      throw new Error('Could not authenticate HR user. Stopping further tests.');
    }

    const hrAuthHeader = `Bearer ${hrToken}`;

    // 3. HR Dashboard API
    const dashRes = await request(app)
      .get('/api/v1/dashboard/hr')
      .set('Authorization', hrAuthHeader);
    assert(
      dashRes.status === 200 &&
      dashRes.body.data?.overview &&
      typeof dashRes.body.data.overview.totalEmployees === 'number',
      'GET /api/v1/dashboard/hr (HR Workforce Dashboard Overview & Queues)'
    );

    // 4. Attendance: Admin Daily Roster
    const attDailyRes = await request(app)
      .get('/api/v1/attendance/admin/daily')
      .set('Authorization', hrAuthHeader);
    assert(
      attDailyRes.status === 200 && Array.isArray(attDailyRes.body.data),
      'GET /api/v1/attendance/admin/daily (Daily Attendance Roster)'
    );

    // 5. Attendance: HR Personal Today Status
    const attTodayRes = await request(app)
      .get('/api/v1/attendance/today')
      .set('Authorization', hrAuthHeader);
    assert(
      attTodayRes.status === 200 && attTodayRes.body.data?.status,
      'GET /api/v1/attendance/today (Personal Live Stopwatch Status)'
    );

    // 6. Attendance: HR Personal History
    const attHistoryRes = await request(app)
      .get('/api/v1/attendance/my-history')
      .set('Authorization', hrAuthHeader);
    assert(
      attHistoryRes.status === 200 && Array.isArray(attHistoryRes.body.data?.records),
      'GET /api/v1/attendance/my-history (Personal Monthly Calendar History)'
    );

    // 7. Attendance Correction: Submit Request
    const todayStr = new Date().toISOString().split('T')[0];
    const submitCorrectionRes = await request(app)
      .post('/api/v1/attendance/corrections')
      .set('Authorization', hrAuthHeader)
      .send({
        date: todayStr,
        punchType: 'Check In Time',
        originalTime: '09:45 AM',
        requestedTime: '09:05 AM',
        reason: 'Automated test correction request'
      });
    assert(
      submitCorrectionRes.status === 201 && submitCorrectionRes.body.data?.id,
      'POST /api/v1/attendance/corrections (Submit Correction Request)'
    );
    const createdCorrectionId = submitCorrectionRes.body.data?.id;

    // 8. Attendance Correction: Get My Corrections
    const myCorrectionsRes = await request(app)
      .get('/api/v1/attendance/corrections/mine')
      .set('Authorization', hrAuthHeader);
    assert(
      myCorrectionsRes.status === 200 && Array.isArray(myCorrectionsRes.body.data),
      'GET /api/v1/attendance/corrections/mine (My Correction Requests)'
    );

    // 9. Attendance Correction: Admin List Corrections
    const adminCorrectionsRes = await request(app)
      .get('/api/v1/attendance/admin/corrections')
      .set('Authorization', hrAuthHeader);
    assert(
      adminCorrectionsRes.status === 200 && Array.isArray(adminCorrectionsRes.body.data),
      'GET /api/v1/attendance/admin/corrections (Admin View All Corrections)'
    );

    // 10. Attendance Correction: Get Specific Detail
    if (createdCorrectionId) {
      const detailCorrectionRes = await request(app)
        .get(`/api/v1/attendance/admin/corrections/${createdCorrectionId}`)
        .set('Authorization', hrAuthHeader);
      assert(
        detailCorrectionRes.status === 200 && detailCorrectionRes.body.data?.id === createdCorrectionId,
        `GET /api/v1/attendance/admin/corrections/:id (Correction Detail View)`
      );

      // 11. Attendance Correction: Approve Action
      const actionRes = await request(app)
        .patch(`/api/v1/attendance/admin/corrections/${createdCorrectionId}/action`)
        .set('Authorization', hrAuthHeader)
        .send({
          status: 'approved',
          actionReason: 'Verified during automated test run'
        });
      assert(
        actionRes.status === 200 && actionRes.body.data?.status === 'approved',
        `PATCH /api/v1/attendance/admin/corrections/:id/action (Approve Correction)`
      );
    }

    // 12. Leaves: Personal Balances
    const leaveBalancesRes = await request(app)
      .get('/api/v1/leaves/my-balances')
      .set('Authorization', hrAuthHeader);
    assert(
      leaveBalancesRes.status === 200 && Array.isArray(leaveBalancesRes.body.data?.balances),
      'GET /api/v1/leaves/my-balances (Personal Leave Balances Quota)'
    );

    // 13. Leaves: Personal Requests
    const myLeavesRes = await request(app)
      .get('/api/v1/leaves/my-requests')
      .set('Authorization', hrAuthHeader);
    assert(
      myLeavesRes.status === 200 && Array.isArray(myLeavesRes.body.data?.requests),
      'GET /api/v1/leaves/my-requests (Personal Leave Application History)'
    );

    // 14. Leaves: Admin All Requests
    const adminLeavesRes = await request(app)
      .get('/api/v1/leaves/admin/requests')
      .set('Authorization', hrAuthHeader);
    assert(
      adminLeavesRes.status === 200 && Array.isArray(adminLeavesRes.body.data),
      'GET /api/v1/leaves/admin/requests (Admin Leave Approvals List)'
    );

    // 15. Leaves: Holiday Management
    const holidaysRes = await request(app)
      .get('/api/v1/leaves/holidays')
      .set('Authorization', hrAuthHeader);
    assert(
      holidaysRes.status === 200 && Array.isArray(holidaysRes.body.data),
      'GET /api/v1/leaves/holidays (Holiday Calendar Management)'
    );

    // 16. Reports: Attendance Report (JSON)
    const repAttJson = await request(app)
      .get('/api/v1/reports/attendance')
      .set('Authorization', hrAuthHeader);
    assert(
      repAttJson.status === 200 && repAttJson.body.data?.summary && Array.isArray(repAttJson.body.data?.records),
      'GET /api/v1/reports/attendance (Attendance Report JSON)'
    );

    // 17. Reports: Attendance Report (CSV)
    const repAttCsv = await request(app)
      .get('/api/v1/reports/attendance?format=csv')
      .set('Authorization', hrAuthHeader);
    assert(
      repAttCsv.status === 200 && repAttCsv.headers['content-type'].includes('text/csv'),
      'GET /api/v1/reports/attendance?format=csv (Attendance Report CSV Export)'
    );

    // 18. Reports: Leave Report (JSON)
    const repLeaveJson = await request(app)
      .get('/api/v1/reports/leave')
      .set('Authorization', hrAuthHeader);
    assert(
      repLeaveJson.status === 200 && repLeaveJson.body.data?.summary && Array.isArray(repLeaveJson.body.data?.records),
      'GET /api/v1/reports/leave (Leave Report JSON)'
    );

    // 19. Reports: Employee Summary Report
    const repEmpSummary = await request(app)
      .get(`/api/v1/reports/employee-summary?userId=${hrUserId}`)
      .set('Authorization', hrAuthHeader);
    assert(
      repEmpSummary.status === 200 && repEmpSummary.body.data?.employee && repEmpSummary.body.data?.attendanceSummary,
      'GET /api/v1/reports/employee-summary (Employee Dossier Audit Summary)'
    );

    // 20. Notifications: Personal Notifications
    const notifRes = await request(app)
      .get('/api/v1/notifications/my')
      .set('Authorization', hrAuthHeader);
    assert(
      notifRes.status === 200 && Array.isArray(notifRes.body.data),
      'GET /api/v1/notifications/my (Notifications Stream)'
    );

    // 21. Profile: HR Personal Profile
    const profileRes = await request(app)
      .get('/api/v1/employees/me')
      .set('Authorization', hrAuthHeader);
    assert(
      profileRes.status === 200 && profileRes.body.data?.id === hrUserId,
      'GET /api/v1/employees/me (HR Personal Profile)'
    );

    // 22. RBAC Security Check: Standard employee must be denied from /api/v1/dashboard/hr
    const empLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'john.doe@hrmanagement.com', password: 'UserPassword@123' });
    
    if (empLogin.body.data?.accessToken) {
      const empToken = empLogin.body.data?.accessToken;
      const forbiddenRes = await request(app)
        .get('/api/v1/dashboard/hr')
        .set('Authorization', `Bearer ${empToken}`);
      assert(
        forbiddenRes.status === 403,
        'RBAC: Employee is blocked from HR Dashboard with 403 Forbidden'
      );
    } else {
      console.log('Employee login response:', empLogin.body);
    }

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    console.log('\n====================================================');
    console.log(`📊 Test Results: Passed: ${passed} | Failed: ${failed}`);
    console.log('====================================================\n');
    await closeConnection();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
