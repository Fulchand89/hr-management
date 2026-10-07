const {
  sequelize,
  Role,
  Permission,
  RolePermission,
  User,
  UserPermission,
  Designation,
  Department,
  Branch,
  Shift,
  Attendance,
  AttendanceCorrection,
  Holiday,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  SalaryStructure,
  Payroll,
  EmployeeDocument,
  CompanyAsset,
  Notification,
  ActivityLog
} = require('./src/models');
const { ROLES } = require('./src/constants/roles');
const { USER_STATUS } = require('./src/constants/status');
const { closeConnection } = require('./src/config/db');
const logger = require('./src/config/logger');

const seedDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Connected to database. Synchronizing tables...');

    // Tables are managed via migrations
    // await sequelize.sync();

    logger.info('Starting complete 20-Table HRMS seeding process...');

    // ==========================================
    // 1. SEED ROLES
    // ==========================================
    const roleDefs = [
      { name: ROLES.ADMIN, displayName: 'System Administrator', description: 'Complete administrative and organizational access.', isSystem: true },
      { name: ROLES.HR, displayName: 'HR Manager', description: 'HR management, payroll, leave & attendance.', isSystem: true },
      { name: ROLES.MANAGER, displayName: 'Department Manager', description: 'Team management, attendance & leave approvals.', isSystem: true },
      { name: ROLES.EMPLOYEE, displayName: 'Standard Employee', description: 'Employee self-service portal access.', isSystem: true }
    ];
    const rolesMap = {};
    for (const def of roleDefs) {
      let role = await Role.findOne({ where: { name: def.name } });
      if (!role) role = await Role.create(def);
      rolesMap[def.name] = role;
    }

    // ==========================================
    // 2. SEED PERMISSIONS
    // ==========================================
    const permDefs = [
      { name: 'users:create', displayName: 'Create Users', module: 'users' },
      { name: 'users:read', displayName: 'View Users', module: 'users' },
      { name: 'users:update', displayName: 'Update Users', module: 'users' },
      { name: 'users:delete', displayName: 'Delete Users', module: 'users' },
      { name: 'roles:read', displayName: 'View Roles', module: 'roles' },
      { name: 'roles:manage', displayName: 'Manage Roles', module: 'roles' },
      { name: 'permissions:read', displayName: 'View Permissions', module: 'permissions' },
      { name: 'permissions:assign', displayName: 'Assign Permissions', module: 'permissions' },
      { name: 'attendance:read', displayName: 'View Attendance', module: 'attendance' },
      { name: 'attendance:log', displayName: 'Log Attendance', module: 'attendance' },
      { name: 'attendance:approve', displayName: 'Approve Attendance', module: 'attendance' },
      { name: 'leave:read', displayName: 'View Leave', module: 'leave' },
      { name: 'leave:apply', displayName: 'Apply for Leave', module: 'leave' },
      { name: 'leave:approve', displayName: 'Approve Leave', module: 'leave' },
      { name: 'payroll:read', displayName: 'View Payroll', module: 'payroll' },
      { name: 'payroll:process', displayName: 'Process Payroll', module: 'payroll' },
      { name: 'reports:view', displayName: 'View Reports', module: 'reports' },
      { name: 'reports:export', displayName: 'Export Reports', module: 'reports' }
    ];
    const permsMap = {};
    for (const def of permDefs) {
      let perm = await Permission.findOne({ where: { name: def.name } });
      if (!perm) perm = await Permission.create(def);
      permsMap[def.name] = perm;
    }

    // Assign to roles
    await rolesMap[ROLES.ADMIN].setPermissions(Object.values(permsMap));
    await rolesMap[ROLES.HR].setPermissions([
      permsMap['users:create'], permsMap['users:read'], permsMap['users:update'], permsMap['users:delete'],
      permsMap['roles:read'], permsMap['permissions:read'], permsMap['attendance:read'], permsMap['attendance:log'],
      permsMap['attendance:approve'], permsMap['leave:read'], permsMap['leave:apply'], permsMap['leave:approve'],
      permsMap['payroll:read'], permsMap['payroll:process'], permsMap['reports:view'], permsMap['reports:export']
    ]);
    await rolesMap[ROLES.MANAGER].setPermissions([
      permsMap['users:read'], permsMap['attendance:read'], permsMap['attendance:log'],
      permsMap['attendance:approve'], permsMap['leave:read'], permsMap['leave:apply'], permsMap['leave:approve'],
      permsMap['reports:view']
    ]);
    await rolesMap[ROLES.EMPLOYEE].setPermissions([
      permsMap['users:read'], permsMap['attendance:read'], permsMap['attendance:log'],
      permsMap['leave:read'], permsMap['leave:apply'], permsMap['payroll:read']
    ]);

    // ==========================================
    // 3. SEED BRANCHES
    // ==========================================
    const branchDefs = [
      { name: 'Headquarters - Noida', code: 'HQ-NOIDA', city: 'Noida', state: 'Uttar Pradesh', country: 'India', address: 'Sector 62, Electronic City, Noida' },
      { name: 'Tech Hub - Bengaluru', code: 'TECH-BLR', city: 'Bengaluru', state: 'Karnataka', country: 'India', address: 'Whitefield, IT Park, Bengaluru' },
      { name: 'Remote Global', code: 'REMOTE-GL', city: 'Virtual', state: 'All', country: 'Global', address: 'Work From Anywhere' }
    ];
    const branchesMap = {};
    for (const b of branchDefs) {
      let branch = await Branch.findOne({ where: { name: b.name } });
      if (!branch) branch = await Branch.create(b);
      branchesMap[b.code] = branch;
    }

    // ==========================================
    // 4. SEED DESIGNATIONS
    // ==========================================
    const desigDefs = [
      { title: 'Chief Technology Officer', code: 'CTO', department: 'Executive', description: 'Head of technical architecture.' },
      { title: 'HR Lead Specialist', code: 'HR-LEAD', department: 'Human Resources', description: 'Manages employee lifecycles and payroll.' },
      { title: 'Regional Branch Manager', code: 'MGR-REG', department: 'Sales & Operations', description: 'Oversees regional teams.' },
      { title: 'Full Stack Developer', code: 'FSD', department: 'Engineering', description: 'Builds core software services.' },
      { title: 'QA Automation Engineer', code: 'QA-ENG', department: 'Engineering', description: 'Tests system reliability.' }
    ];
    const desigsMap = {};
    for (const d of desigDefs) {
      let desig = await Designation.findOne({ where: { title: d.title } });
      if (!desig) desig = await Designation.create(d);
      desigsMap[d.code] = desig;
    }

    // ==========================================
    // 5. SEED DEPARTMENTS
    // ==========================================
    const deptDefs = [
      { name: 'Executive Leadership', code: 'EXEC', description: 'C-suite strategic direction and operations.' },
      { name: 'Human Resources', code: 'HR', description: 'People operations, recruitment, and culture.' },
      { name: 'Engineering & Technology', code: 'ENG', description: 'Software engineering, DevOps, and QA.' },
      { name: 'Sales & Operations', code: 'SALES', description: 'Client acquisition and field operations.' },
      { name: 'Finance & Accounts', code: 'FIN', description: 'Financial planning, audits, and billing.' }
    ];
    const deptsMap = {};
    for (const d of deptDefs) {
      let dept = await Department.findOne({ where: { name: d.name } });
      if (!dept) dept = await Department.create(d);
      deptsMap[d.code] = dept;
    }

    // ==========================================
    // 6. SEED USERS (EMPLOYEES)
    // ==========================================

    // 1. Admin (CTO)
    let admin = await User.findOne({ where: { email: 'admin@hrmanagement.com' } });
    if (!admin) {
      admin = await User.create({
        employeeCode: 'EMP-001',
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@hrmanagement.com',
        password: 'AdminPassword@123',
        role: ROLES.ADMIN,
        roleId: rolesMap[ROLES.ADMIN].id,
        designation: 'Chief Technology Officer',
        designationId: desigsMap['CTO'].id,
        department: 'Executive Leadership',
        departmentId: deptsMap['EXEC'].id,
        branchId: branchesMap['HQ-NOIDA'].id,
        joiningDate: '2022-01-01',
        salary: 180000.00,
        dob: '1985-05-15',
        gender: 'male',
        phone: '+91-9876543210',
        status: USER_STATUS.ACTIVE
      });
    } else {
      admin.employeeCode = 'EMP-001';
      admin.roleId = rolesMap[ROLES.ADMIN].id;
      admin.designationId = desigsMap['CTO'].id;
      admin.departmentId = deptsMap['EXEC'].id;
      admin.branchId = branchesMap['HQ-NOIDA'].id;
      await admin.save();
    }
    deptsMap['EXEC'].headId = admin.id;
    await deptsMap['EXEC'].save();

    // 2. HR Manager
    let hr = await User.findOne({ where: { email: 'hr@hrmanagement.com' } });
    if (!hr) {
      hr = await User.create({
        employeeCode: 'EMP-002',
        firstName: 'Sarah',
        lastName: 'Connor',
        email: 'hr@hrmanagement.com',
        password: 'HrPassword@123',
        role: ROLES.HR,
        roleId: rolesMap[ROLES.HR].id,
        designation: 'HR Lead Specialist',
        designationId: desigsMap['HR-LEAD'].id,
        department: 'Human Resources',
        departmentId: deptsMap['HR'].id,
        branchId: branchesMap['HQ-NOIDA'].id,
        managerId: admin.id,
        joiningDate: '2023-03-15',
        salary: 95000.00,
        dob: '1990-08-20',
        gender: 'female',
        phone: '+91-9876543211',
        status: USER_STATUS.ACTIVE
      });
    } else {
      hr.employeeCode = 'EMP-002';
      hr.roleId = rolesMap[ROLES.HR].id;
      hr.designationId = desigsMap['HR-LEAD'].id;
      hr.departmentId = deptsMap['HR'].id;
      hr.branchId = branchesMap['HQ-NOIDA'].id;
      hr.managerId = admin.id;
      await hr.save();
    }
    deptsMap['HR'].headId = hr.id;
    await deptsMap['HR'].save();

    // 3. Department Manager
    let manager = await User.findOne({ where: { email: 'manager@hrmanagement.com' } });
    if (!manager) {
      manager = await User.create({
        employeeCode: 'EMP-003',
        firstName: 'Michael',
        lastName: 'Scott',
        email: 'manager@hrmanagement.com',
        password: 'ManagerPassword@123',
        role: ROLES.MANAGER,
        roleId: rolesMap[ROLES.MANAGER].id,
        designation: 'Regional Branch Manager',
        designationId: desigsMap['MGR-REG'].id,
        department: 'Sales & Operations',
        departmentId: deptsMap['SALES'].id,
        branchId: branchesMap['TECH-BLR'].id,
        managerId: admin.id,
        joiningDate: '2023-06-01',
        salary: 110000.00,
        dob: '1988-11-10',
        gender: 'male',
        phone: '+91-9876543212',
        status: USER_STATUS.ACTIVE
      });
    } else {
      manager.employeeCode = 'EMP-003';
      manager.roleId = rolesMap[ROLES.MANAGER].id;
      manager.designationId = desigsMap['MGR-REG'].id;
      manager.departmentId = deptsMap['SALES'].id;
      manager.branchId = branchesMap['TECH-BLR'].id;
      manager.managerId = admin.id;
      await manager.save();
    }
    deptsMap['SALES'].headId = manager.id;
    await deptsMap['SALES'].save();

    // 4. Employee (John Doe, reports to Manager)
    let emp = await User.findOne({ where: { email: 'john.doe@hrmanagement.com' } });
    if (!emp) {
      emp = await User.create({
        employeeCode: 'EMP-004',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@hrmanagement.com',
        password: 'UserPassword@123',
        role: ROLES.EMPLOYEE,
        roleId: rolesMap[ROLES.EMPLOYEE].id,
        designation: 'Full Stack Developer',
        designationId: desigsMap['FSD'].id,
        department: 'Engineering & Technology',
        departmentId: deptsMap['ENG'].id,
        branchId: branchesMap['TECH-BLR'].id,
        managerId: manager.id, // Reports to Michael Scott!
        joiningDate: '2024-01-15',
        salary: 75000.00,
        dob: '1995-04-12',
        gender: 'male',
        phone: '+91-9876543213',
        status: USER_STATUS.ACTIVE
      });
    } else {
      emp.employeeCode = 'EMP-004';
      emp.roleId = rolesMap[ROLES.EMPLOYEE].id;
      emp.designationId = desigsMap['FSD'].id;
      emp.departmentId = deptsMap['ENG'].id;
      emp.branchId = branchesMap['TECH-BLR'].id;
      emp.managerId = manager.id;
      await emp.save();
    }

    // Direct User Permission
    await UserPermission.findOrCreate({
      where: { userId: emp.id, permissionId: permsMap['reports:view'].id },
      defaults: { userId: emp.id, permissionId: permsMap['reports:view'].id, granted: true }
    });

    // ==========================================
    // 7. SEED SHIFTS
    // ==========================================
    const shiftDefs = [
      { name: 'General Shift', startTime: '09:00', endTime: '18:00', graceMinutes: 15, halfDayThresholdHours: 4.5, fullDayThresholdHours: 8.0 },
      { name: 'Morning Shift', startTime: '07:00', endTime: '15:30', graceMinutes: 10, halfDayThresholdHours: 4.0, fullDayThresholdHours: 7.5 },
      { name: 'Night Shift', startTime: '21:00', endTime: '05:30', graceMinutes: 15, halfDayThresholdHours: 4.0, fullDayThresholdHours: 7.5 }
    ];
    let generalShift = await Shift.findOne({ where: { name: 'General Shift' } });
    if (!generalShift) {
      generalShift = await Shift.create(shiftDefs[0]);
      await Shift.create(shiftDefs[1]);
      await Shift.create(shiftDefs[2]);
    }

    // ==========================================
    // 8. SEED HOLIDAYS
    // ==========================================
    const holidayDefs = [
      { title: 'New Year Day', date: '2026-01-01', type: 'national', description: 'Celebration of the New Year' },
      { title: 'Republic Day', date: '2026-01-26', type: 'national', description: 'Celebration of Indian Constitution' },
      { title: 'Independence Day', date: '2026-08-15', type: 'national', description: 'National Independence Day' },
      { title: 'Gandhi Jayanti', date: '2026-10-02', type: 'national', description: 'Birth anniversary of Mahatma Gandhi' },
      { title: 'Diwali', date: '2026-11-08', type: 'gazetted', description: 'Festival of Lights' }
    ];
    for (const h of holidayDefs) {
      await Holiday.findOrCreate({ where: { date: h.date }, defaults: h });
    }

    // ==========================================
    // 9. SEED LEAVE TYPES & BALANCES
    // ==========================================
    const leaveDefs = [
      { name: 'Casual Leave', code: 'CL', daysPerYear: 12.0, isCarryForward: false, isPaid: true, description: 'Short personal leaves' },
      { name: 'Sick Leave', code: 'SL', daysPerYear: 10.0, isCarryForward: true, isPaid: true, description: 'Medical recovery leaves' },
      { name: 'Paid / Earned Leave', code: 'PL', daysPerYear: 18.0, isCarryForward: true, isPaid: true, description: 'Annual vacation leaves' },
      { name: 'Maternity Leave', code: 'ML', daysPerYear: 180.0, isCarryForward: false, isPaid: true, description: 'Maternity leaves for mothers' }
    ];
    const leaveTypesMap = {};
    for (const lt of leaveDefs) {
      let [leaveType] = await LeaveType.findOrCreate({ where: { code: lt.code }, defaults: lt });
      leaveTypesMap[lt.code] = leaveType;
    }

    // Seed balances for John Doe
    for (const [code, lt] of Object.entries(leaveTypesMap)) {
      await LeaveBalance.findOrCreate({
        where: { userId: emp.id, leaveTypeId: lt.id, year: 2026 },
        defaults: {
          userId: emp.id,
          leaveTypeId: lt.id,
          year: 2026,
          allocated: lt.daysPerYear,
          used: 2.0,
          remaining: lt.daysPerYear - 2.0
        }
      });
    }

    // ==========================================
    // 10. SEED SAMPLE LEAVE REQUEST
    // ==========================================
    await LeaveRequest.findOrCreate({
      where: { userId: emp.id, startDate: '2026-10-10' },
      defaults: {
        userId: emp.id,
        leaveTypeId: leaveTypesMap['CL'].id,
        startDate: '2026-10-10',
        endDate: '2026-10-12',
        totalDays: 2.0,
        reason: 'Family wedding celebration in hometown.',
        status: 'approved',
        actionedBy: manager.id,
        actionReason: 'Approved as coverage is arranged.',
        actionedAt: new Date()
      }
    });

    // ==========================================
    // 11. SEED DAILY ATTENDANCE
    // ==========================================
    const todayStr = new Date().toISOString().split('T')[0];
    await Attendance.findOrCreate({
      where: { userId: emp.id, date: todayStr },
      defaults: {
        userId: emp.id,
        shiftId: generalShift.id,
        date: todayStr,
        clockIn: new Date(new Date().setHours(9, 5, 0)),
        clockOut: new Date(new Date().setHours(18, 10, 0)),
        totalHours: 9.08,
        status: 'present',
        ipAddress: '192.168.1.100',
        remarks: 'Normal biometric check-in'
      }
    });

    // ==========================================
    // 12. SEED SALARY STRUCTURE & PAYROLL
    // ==========================================
    await SalaryStructure.findOrCreate({
      where: { userId: emp.id },
      defaults: {
        userId: emp.id,
        ctc: 900000.00,
        basicSalary: 37500.00,
        hra: 18750.00,
        specialAllowance: 12000.00,
        pfDeduction: 1800.00,
        esiDeduction: 0.00,
        taxDeduction: 2500.00,
        netSalary: 63950.00
      }
    });

    await Payroll.findOrCreate({
      where: { userId: emp.id, month: 9, year: 2026 },
      defaults: {
        userId: emp.id,
        month: 9,
        year: 2026,
        workingDays: 30,
        presentDays: 30.0,
        grossSalary: 68250.00,
        totalDeductions: 4300.00,
        netSalary: 63950.00,
        paymentStatus: 'paid',
        paidAt: '2026-09-30',
        transactionReference: 'NEFT-SBIN20260930001'
      }
    });

    // ==========================================
    // 13. SEED EMPLOYEE DOCUMENTS
    // ==========================================
    await EmployeeDocument.findOrCreate({
      where: { userId: emp.id, title: 'Identity Proof - Aadhaar' },
      defaults: {
        userId: emp.id,
        title: 'Identity Proof - Aadhaar',
        documentType: 'id_proof',
        fileUrl: '/uploads/documents/emp-004-aadhaar.pdf',
        fileSize: 1048576,
        mimeType: 'application/pdf',
        verificationStatus: 'verified'
      }
    });

    // ==========================================
    // 14. SEED COMPANY ASSETS
    // ==========================================
    await CompanyAsset.findOrCreate({
      where: { serialNumber: 'MBP-M3-2026-004' },
      defaults: {
        assetName: 'Apple MacBook Pro M3 14-inch (18GB/512GB)',
        serialNumber: 'MBP-M3-2026-004',
        category: 'laptop',
        assignedTo: emp.id,
        assignedDate: '2024-01-16',
        condition: 'good',
        status: 'allocated'
      }
    });

    // ==========================================
    // 15. SEED NOTIFICATIONS & ACTIVITY LOGS
    // ==========================================
    await Notification.findOrCreate({
      where: { userId: emp.id, title: 'Welcome to HR Management Portal' },
      defaults: {
        userId: emp.id,
        title: 'Welcome to HR Management Portal',
        message: 'Your profile has been created and verified. You can now access your attendance, leaves, and salary slips.',
        type: 'announcement',
        isRead: false
      }
    });

    // ==========================================
    // 16. SEED ATTENDANCE CORRECTIONS
    // ==========================================
    await AttendanceCorrection.findOrCreate({
      where: { userId: emp.id, date: '2026-01-01' },
      defaults: {
        userId: emp.id,
        date: '2026-01-01',
        punchType: 'Check In Time',
        originalTime: '10:15 AM',
        requestedTime: '09:05 AM',
        reason: 'I was on time but system was not working properly',
        status: 'pending'
      }
    });

    await ActivityLog.create({
      userId: admin.id,
      action: 'SYSTEM_FULL_INITIALIZATION',
      module: 'system',
      targetId: 'HRMS_PORTAL',
      ipAddress: '127.0.0.1',
      details: JSON.stringify({ message: '21 HRMS Tables initialized and seeded with enterprise standard data.' })
    });

    logger.success('All 21 Tables in HR Management System successfully seeded with enterprise data!');
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
    process.exit(0);
  }
};

seedDatabase();
