const request = require('supertest');
const app = require('./src/app');
const { closeConnection } = require('./src/config/db');

async function testAllApis() {
  console.log('\n===============================================================');
  console.log('   🧪 COMPREHENSIVE FULL-SUITE BACKEND API TEST RUNNER');
  console.log('===============================================================\n');

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
    // =========================================================
    // SECTION 1: SYSTEM & HEALTH
    // =========================================================
    console.log('\n--- [1/10] System & Health Check ---');
    const healthRes = await request(app).get('/api/v1/health');
    assert(healthRes.status === 200 && healthRes.body.database === 'connected', 'GET /api/v1/health - DB Connected & Healthy');

    // =========================================================
    // SECTION 2: AUTHENTICATION (Admin, HR, Employee)
    // =========================================================
    console.log('\n--- [2/10] Authentication & Token Generation ---');
    
    // 2.1 Admin login
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hrmanagement.com', password: 'AdminPassword@123' });
    assert(adminLoginRes.status === 200 && Boolean(adminLoginRes.body.data?.accessToken), 'POST /api/v1/auth/login (Admin Login)');
    const adminToken = adminLoginRes.body.data?.accessToken;
    const adminAuthHeader = `Bearer ${adminToken}`;
    const adminUserId = adminLoginRes.body.data?.user?.id;

    // 2.2 HR login
    const hrLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'hr@hrmanagement.com', password: 'HrPassword@123' });
    assert(hrLoginRes.status === 200 && Boolean(hrLoginRes.body.data?.accessToken), 'POST /api/v1/auth/login (HR Login)');
    const hrToken = hrLoginRes.body.data?.accessToken;
    const hrAuthHeader = `Bearer ${hrToken}`;
    const hrUserId = hrLoginRes.body.data?.user?.id;

    // 2.3 Employee login
    const empLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'john.doe@hrmanagement.com', password: 'UserPassword@123' });
    assert(empLoginRes.status === 200 && Boolean(empLoginRes.body.data?.accessToken), 'POST /api/v1/auth/login (Employee Login)');
    const empToken = empLoginRes.body.data?.accessToken;
    const empAuthHeader = `Bearer ${empToken}`;
    const empUserId = empLoginRes.body.data?.user?.id;

    // 2.4 Token Refresh test
    const refreshToken = empLoginRes.body.data?.refreshToken;
    if (refreshToken) {
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });
      assert(refreshRes.status === 200 && Boolean(refreshRes.body.data?.accessToken), 'POST /api/v1/auth/refresh (Token Refresh)');
    }

    // 2.5 Auth Me endpoint
    const authMeRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', empAuthHeader);
    assert(authMeRes.status === 200 && authMeRes.body.data?.user?.email === 'john.doe@hrmanagement.com', 'GET /api/v1/auth/me (Verify Active Session Token)');

    // =========================================================
    // SECTION 3: EMPLOYEES & USERS MODULE
    // =========================================================
    console.log('\n--- [3/10] Employees & Users Module ---');

    // 3.1 Get own profile (Employee)
    const empMeRes = await request(app)
      .get('/api/v1/employees/me')
      .set('Authorization', empAuthHeader);
    assert(empMeRes.status === 200 && empMeRes.body.data?.email === 'john.doe@hrmanagement.com', 'GET /api/v1/employees/me (Own Profile)');

    // 3.2 Update own profile
    const updateProfileRes = await request(app)
      .put('/api/v1/employees/me')
      .set('Authorization', empAuthHeader)
      .send({ phone: '+91-9876543210' });
    assert(updateProfileRes.status === 200, 'PUT /api/v1/employees/me (Update Whitelisted Profile Fields)');

    // 3.3 List all employees (Admin/HR)
    const allEmpsRes = await request(app)
      .get('/api/v1/employees')
      .set('Authorization', hrAuthHeader);
    assert(allEmpsRes.status === 200 && Array.isArray(allEmpsRes.body.data), 'GET /api/v1/employees (All Employees Roster)');

    // 3.4 Get employee by ID
    const singleEmpRes = await request(app)
      .get(`/api/v1/employees/${empUserId}`)
      .set('Authorization', hrAuthHeader);
    assert(singleEmpRes.status === 200 && singleEmpRes.body.data?.id === empUserId, 'GET /api/v1/employees/:id (Employee 360 View)');

    // 3.5 Get employee status
    const empStatusRes = await request(app)
      .get(`/api/v1/employees/${empUserId}/status`)
      .set('Authorization', hrAuthHeader);
    assert(empStatusRes.status === 200 && empStatusRes.body.data?.realTimePulse, 'GET /api/v1/employees/:id/status (Realtime Employment Status)');

    // 3.6 Users API (Admin/HR)
    const usersListRes = await request(app)
      .get('/api/v1/users')
      .set('Authorization', adminAuthHeader);
    assert(usersListRes.status === 200 && Array.isArray(usersListRes.body.data), 'GET /api/v1/users (Users Directory)');

    // =========================================================
    // SECTION 4: DEPARTMENTS & DESIGNATIONS MASTER DATA
    // =========================================================
    console.log('\n--- [4/10] Departments & Designations Master Data ---');

    // 4.1 Departments List
    const deptsRes = await request(app)
      .get('/api/v1/departments')
      .set('Authorization', hrAuthHeader);
    assert(deptsRes.status === 200 && Array.isArray(deptsRes.body.data), 'GET /api/v1/departments (Departments List)');
    const sampleDeptId = deptsRes.body.data?.[0]?.id;

    // 4.2 Department Detail by ID
    if (sampleDeptId) {
      const deptDetailRes = await request(app)
        .get(`/api/v1/departments/${sampleDeptId}`)
        .set('Authorization', hrAuthHeader);
      assert(deptDetailRes.status === 200 && deptDetailRes.body.data?.id === sampleDeptId, 'GET /api/v1/departments/:id (Department Detail)');
    }

    // 4.3 Designations List
    const desigsRes = await request(app)
      .get('/api/v1/designations')
      .set('Authorization', hrAuthHeader);
    assert(desigsRes.status === 200 && Array.isArray(desigsRes.body.data), 'GET /api/v1/designations (Designations List)');
    const sampleDesigId = desigsRes.body.data?.[0]?.id;

    // 4.4 Designation Stats
    const desigStatsRes = await request(app)
      .get('/api/v1/designations/stats')
      .set('Authorization', hrAuthHeader);
    assert(desigStatsRes.status === 200, 'GET /api/v1/designations/stats (Designation Metrics)');

    // 4.5 Designation Detail by ID
    if (sampleDesigId) {
      const desigDetailRes = await request(app)
        .get(`/api/v1/designations/${sampleDesigId}`)
        .set('Authorization', hrAuthHeader);
      assert(desigDetailRes.status === 200 && desigDetailRes.body.data?.id === sampleDesigId, 'GET /api/v1/designations/:id (Designation Detail)');
    }

    // =========================================================
    // SECTION 5: ROLES & PERMISSIONS (RBAC)
    // =========================================================
    console.log('\n--- [5/10] Roles & Permissions (RBAC) ---');

    // 5.1 Roles List
    const rolesRes = await request(app)
      .get('/api/v1/roles')
      .set('Authorization', adminAuthHeader);
    assert(rolesRes.status === 200 && Array.isArray(rolesRes.body.data), 'GET /api/v1/roles (Roles Catalog)');
    const sampleRoleId = rolesRes.body.data?.[0]?.id;

    // 5.2 Role Detail by ID
    if (sampleRoleId) {
      const roleDetailRes = await request(app)
        .get(`/api/v1/roles/${sampleRoleId}`)
        .set('Authorization', adminAuthHeader);
      assert(roleDetailRes.status === 200 && roleDetailRes.body.data?.id === sampleRoleId, 'GET /api/v1/roles/:id (Role Details)');
    }

    // 5.3 Permissions List
    const permsRes = await request(app)
      .get('/api/v1/permissions')
      .set('Authorization', adminAuthHeader);
    assert(permsRes.status === 200 && Array.isArray(permsRes.body.data), 'GET /api/v1/permissions (System Permissions)');

    // =========================================================
    // SECTION 6: DASHBOARDS (Employee & HR)
    // =========================================================
    console.log('\n--- [6/10] Dashboard Aggregation Endpoints ---');

    // 6.1 Employee Dashboard
    const empDashRes = await request(app)
      .get('/api/v1/dashboard/employee')
      .set('Authorization', empAuthHeader);
    assert(empDashRes.status === 200 && empDashRes.body.data?.leaveBalances !== undefined, 'GET /api/v1/dashboard/employee (Employee Personal Dashboard)');

    // 6.2 HR Dashboard
    const hrDashRes = await request(app)
      .get('/api/v1/dashboard/hr')
      .set('Authorization', hrAuthHeader);
    assert(
      hrDashRes.status === 200 &&
      hrDashRes.body.data?.overview &&
      typeof hrDashRes.body.data.overview.totalEmployees === 'number',
      'GET /api/v1/dashboard/hr (HR Workforce Intelligence Dashboard)'
    );

    // =========================================================
    // SECTION 7: ATTENDANCE & STOPWATCH WORKFLOW
    // =========================================================
    console.log('\n--- [7/10] Attendance & Time Tracking Workflow ---');

    // 7.1 Today Stopwatch Status
    const todayStatusRes = await request(app)
      .get('/api/v1/attendance/today')
      .set('Authorization', empAuthHeader);
    assert(todayStatusRes.status === 200 && todayStatusRes.body.data?.status, 'GET /api/v1/attendance/today (Live Status)');

    // 7.2 Punch In (or handle already punched in)
    const punchInRes = await request(app)
      .post('/api/v1/attendance/punch-in')
      .set('Authorization', empAuthHeader)
      .send({ remarks: 'Automated test punch in' });
    assert([200, 201, 400].includes(punchInRes.status), 'POST /api/v1/attendance/punch-in (Punch In Handling)');

    // 7.3 Break cycle
    const breakStartRes = await request(app)
      .post('/api/v1/attendance/break-start')
      .set('Authorization', empAuthHeader)
      .send({ reason: 'Lunch Break' });
    assert([200, 400].includes(breakStartRes.status), 'POST /api/v1/attendance/break-start (Break Start Handling)');

    const breakEndRes = await request(app)
      .post('/api/v1/attendance/break-end')
      .set('Authorization', empAuthHeader);
    assert([200, 400].includes(breakEndRes.status), 'POST /api/v1/attendance/break-end (Break End Handling)');

    // 7.4 Punch Out
    const punchOutRes = await request(app)
      .post('/api/v1/attendance/punch-out')
      .set('Authorization', empAuthHeader)
      .send({ remarks: 'Automated test punch out' });
    assert([200, 400].includes(punchOutRes.status), 'POST /api/v1/attendance/punch-out (Punch Out Handling)');

    // 7.5 Attendance History (Monthly calendar)
    const myHistoryRes = await request(app)
      .get('/api/v1/attendance/my-history')
      .set('Authorization', empAuthHeader);
    assert(myHistoryRes.status === 200 && Array.isArray(myHistoryRes.body.data?.records), 'GET /api/v1/attendance/my-history (Monthly Log)');

    // 7.6 Admin Daily Attendance Roster
    const adminDailyAttRes = await request(app)
      .get('/api/v1/attendance/admin/daily')
      .set('Authorization', hrAuthHeader);
    assert(adminDailyAttRes.status === 200 && Array.isArray(adminDailyAttRes.body.data), 'GET /api/v1/attendance/admin/daily (Admin Attendance Roster)');

    // =========================================================
    // SECTION 8: ATTENDANCE CORRECTIONS MODULE
    // =========================================================
    console.log('\n--- [8/10] Attendance Corrections Module ---');

    // 8.1 Employee submits correction
    const todayDateStr = new Date().toISOString().split('T')[0];
    const submitCorrRes = await request(app)
      .post('/api/v1/attendance/corrections')
      .set('Authorization', empAuthHeader)
      .send({
        date: todayDateStr,
        punchType: 'Check In Time',
        originalTime: '09:50 AM',
        requestedTime: '09:00 AM',
        reason: 'Biometric fingerprint machine delayed input'
      });
    assert(submitCorrRes.status === 201 && submitCorrRes.body.data?.id, 'POST /api/v1/attendance/corrections (Submit Correction)');
    const corrId = submitCorrRes.body.data?.id;

    // 8.2 Employee views their corrections
    const myCorrsRes = await request(app)
      .get('/api/v1/attendance/corrections/mine')
      .set('Authorization', empAuthHeader);
    assert(myCorrsRes.status === 200 && Array.isArray(myCorrsRes.body.data), 'GET /api/v1/attendance/corrections/mine (My Corrections)');

    // 8.3 Admin views all corrections
    const adminCorrsRes = await request(app)
      .get('/api/v1/attendance/admin/corrections')
      .set('Authorization', hrAuthHeader);
    assert(adminCorrsRes.status === 200 && Array.isArray(adminCorrsRes.body.data), 'GET /api/v1/attendance/admin/corrections (Admin Corrections Roster)');

    // 8.4 Admin gets single correction details
    if (corrId) {
      const corrDetailRes = await request(app)
        .get(`/api/v1/attendance/admin/corrections/${corrId}`)
        .set('Authorization', hrAuthHeader);
      assert(corrDetailRes.status === 200 && corrDetailRes.body.data?.id === corrId, 'GET /api/v1/attendance/admin/corrections/:id (Correction Details)');

      // 8.5 Admin approves correction
      const corrActionRes = await request(app)
        .patch(`/api/v1/attendance/admin/corrections/${corrId}/action`)
        .set('Authorization', hrAuthHeader)
        .send({
          status: 'approved',
          actionReason: 'Approved based on team lead confirmation'
        });
      assert(corrActionRes.status === 200 && corrActionRes.body.data?.status === 'approved', 'PATCH /api/v1/attendance/admin/corrections/:id/action (Approve Action)');
    }

    // =========================================================
    // SECTION 9: LEAVE MANAGEMENT & HOLIDAYS
    // =========================================================
    console.log('\n--- [9/10] Leave Management & Holidays ---');

    // 9.1 Leave Types List
    const leaveTypesRes = await request(app)
      .get('/api/v1/leaves/types')
      .set('Authorization', empAuthHeader);
    assert(leaveTypesRes.status === 200 && Array.isArray(leaveTypesRes.body.data), 'GET /api/v1/leaves/types (Leave Types Catalog)');
    const sampleLeaveTypeId = leaveTypesRes.body.data?.[0]?.id;

    // 9.2 Leave Balances
    const myBalancesRes = await request(app)
      .get('/api/v1/leaves/my-balances')
      .set('Authorization', empAuthHeader);
    assert(myBalancesRes.status === 200 && Array.isArray(myBalancesRes.body.data?.balances), 'GET /api/v1/leaves/my-balances (Personal Balances)');

    // 9.3 Leave Requests History
    const myRequestsRes = await request(app)
      .get('/api/v1/leaves/my-requests')
      .set('Authorization', empAuthHeader);
    assert(myRequestsRes.status === 200 && Array.isArray(myRequestsRes.body.data?.requests), 'GET /api/v1/leaves/my-requests (My Requests)');

    // 9.4 Apply for a leave
    let createdLeaveId = null;
    if (sampleLeaveTypeId) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60 + Math.floor(Math.random() * 600));
      const leaveDateStr = futureDate.toISOString().split('T')[0];

      const applyRes = await request(app)
        .post('/api/v1/leaves/apply')
        .set('Authorization', empAuthHeader)
        .send({
          leaveTypeId: sampleLeaveTypeId,
          startDate: leaveDateStr,
          endDate: leaveDateStr,
          totalDays: 1,
          reason: 'Automated test leave application'
        });
      assert([201, 409].includes(applyRes.status), 'POST /api/v1/leaves/apply (Apply Leave Lifecycle)');
      createdLeaveId = applyRes.body.data?.id;

      // If created or existing, fetch detail
      const targetLeaveId = createdLeaveId || myRequestsRes.body.data?.requests?.[0]?.id;
      if (targetLeaveId) {
        const leaveDetailRes = await request(app)
          .get(`/api/v1/leaves/${targetLeaveId}`)
          .set('Authorization', empAuthHeader);
        assert(leaveDetailRes.status === 200 && leaveDetailRes.body.data?.id === targetLeaveId, 'GET /api/v1/leaves/:id (Get Leave Request Detail)');
      }
    }

    // 9.5 Admin Leave Requests List
    const adminLeavesRes = await request(app)
      .get('/api/v1/leaves/admin/requests')
      .set('Authorization', hrAuthHeader);
    assert(adminLeavesRes.status === 200 && Array.isArray(adminLeavesRes.body.data), 'GET /api/v1/leaves/admin/requests (Admin Leave Queue)');

    // 9.6 Holiday List
    const holidaysRes = await request(app)
      .get('/api/v1/leaves/holidays')
      .set('Authorization', empAuthHeader);
    assert(holidaysRes.status === 200 && Array.isArray(holidaysRes.body.data), 'GET /api/v1/leaves/holidays (Holiday Schedule)');

    // =========================================================
    // SECTION 10: REPORTS & NOTIFICATIONS
    // =========================================================
    console.log('\n--- [10/10] Reports & Notifications ---');

    // 10.1 Reports: Attendance (JSON)
    const repAttJsonRes = await request(app)
      .get('/api/v1/reports/attendance')
      .set('Authorization', hrAuthHeader);
    assert(repAttJsonRes.status === 200 && repAttJsonRes.body.data?.summary, 'GET /api/v1/reports/attendance (Attendance JSON)');

    // 10.2 Reports: Attendance (CSV)
    const repAttCsvRes = await request(app)
      .get('/api/v1/reports/attendance?format=csv')
      .set('Authorization', hrAuthHeader);
    assert(repAttCsvRes.status === 200 && repAttCsvRes.headers['content-type'].includes('text/csv'), 'GET /api/v1/reports/attendance?format=csv (Attendance CSV Export)');

    // 10.3 Reports: Leave (JSON)
    const repLeaveJsonRes = await request(app)
      .get('/api/v1/reports/leave')
      .set('Authorization', hrAuthHeader);
    assert(repLeaveJsonRes.status === 200 && repLeaveJsonRes.body.data?.summary, 'GET /api/v1/reports/leave (Leave JSON)');

    // 10.4 Reports: Leave (CSV)
    const repLeaveCsvRes = await request(app)
      .get('/api/v1/reports/leave?format=csv')
      .set('Authorization', hrAuthHeader);
    assert(repLeaveCsvRes.status === 200 && repLeaveCsvRes.headers['content-type'].includes('text/csv'), 'GET /api/v1/reports/leave?format=csv (Leave CSV Export)');

    // 10.5 Reports: Employee Summary (JSON)
    const repEmpSumJsonRes = await request(app)
      .get(`/api/v1/reports/employee-summary?userId=${empUserId}`)
      .set('Authorization', hrAuthHeader);
    assert(repEmpSumJsonRes.status === 200 && repEmpSumJsonRes.body.data?.employee, 'GET /api/v1/reports/employee-summary (Employee Dossier JSON)');

    // 10.6 Reports: Employee Summary (CSV)
    const repEmpSumCsvRes = await request(app)
      .get(`/api/v1/reports/employee-summary?userId=${empUserId}&format=csv`)
      .set('Authorization', hrAuthHeader);
    assert(repEmpSumCsvRes.status === 200 && repEmpSumCsvRes.headers['content-type'].includes('text/csv'), 'GET /api/v1/reports/employee-summary?format=csv (Employee Dossier CSV)');

    // 10.7 Notifications: My notifications
    const myNotifsRes = await request(app)
      .get('/api/v1/notifications/my')
      .set('Authorization', empAuthHeader);
    assert(myNotifsRes.status === 200 && Array.isArray(myNotifsRes.body.data), 'GET /api/v1/notifications/my (Notifications Feed)');

    // 10.8 Notifications: Unread Count
    const unreadCountRes = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', empAuthHeader);
    assert(unreadCountRes.status === 200 && typeof unreadCountRes.body.data?.unreadCount === 'number', 'GET /api/v1/notifications/unread-count (Unread Counter)');

    // 10.9 Notifications: Mark All as Read
    const markAllRes = await request(app)
      .put('/api/v1/notifications/mark-all-read')
      .set('Authorization', empAuthHeader);
    assert(markAllRes.status === 200, 'PUT /api/v1/notifications/mark-all-read (Bulk Read Acknowledgment)');

    // 10.10 Notifications: HR Broadcast Announcement
    const broadcastRes = await request(app)
      .post('/api/v1/notifications/broadcast')
      .set('Authorization', hrAuthHeader)
      .send({
        title: 'System Wide Maintenance',
        message: 'Scheduled backup maintenance at 11:00 PM tonight.'
      });
    assert(broadcastRes.status === 200, 'POST /api/v1/notifications/broadcast (Realtime Announcement)');

    // 10.11 Notifications: Direct user notification
    const directNotifRes = await request(app)
      .post(`/api/v1/notifications/user/${empUserId}`)
      .set('Authorization', hrAuthHeader)
      .send({
        title: 'Correction Approved',
        message: 'Your biometric attendance correction has been approved.'
      });
    assert(directNotifRes.status === 200, 'POST /api/v1/notifications/user/:userId (Targeted Employee Alert)');

    // 10.12 Notifications: WebSocket Status
    const wsStatusRes = await request(app)
      .get('/api/v1/notifications/status')
      .set('Authorization', hrAuthHeader);
    assert(wsStatusRes.status === 200 && typeof wsStatusRes.body.data?.onlineCount === 'number', 'GET /api/v1/notifications/status (WebSocket Server Health)');

  } catch (err) {
    console.error('Fatal test execution error:', err);
    failed++;
  } finally {
    console.log('\n===============================================================');
    console.log(`🏁 FINAL SUITE RESULTS: Total Passed: ${passed} | Total Failed: ${failed}`);
    console.log('===============================================================\n');
    await closeConnection();
    process.exit(failed > 0 ? 1 : 0);
  }
}

testAllApis();
