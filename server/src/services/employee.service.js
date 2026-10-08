const { Op } = require('sequelize');
const {
  User,
  Role,
  Designation,
  Department,
  Branch,
  Shift,
  Attendance,
  Holiday,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  SalaryStructure,
  EmployeeDocument,
  CompanyAsset,
  Notification,
  ActivityLog,
  sequelize
} = require('../models');
const { USER_STATUS } = require('../constants/status');
const { ROLES } = require('../constants/roles');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/apiError');
const { sendWelcomeEmail } = require('./email.service');
const logger = require('../config/logger');

/**
 * Auto-generate next employee code if not provided (e.g., EMP-0005)
 */
const generateEmployeeCode = async () => {
  const count = await User.count();
  const nextNum = String(count + 1).padStart(4, '0');
  let candidate = `EMP-${nextNum}`;

  // Double check uniqueness
  const exists = await User.findOne({ where: { employeeCode: candidate } });
  if (exists) {
    candidate = `EMP-${Date.now().toString().slice(-4)}`;
  }
  return candidate;
};

/**
 * 1. Register a new employee with comprehensive relations & validations
 */
const createEmployee = async (payload, actor = null) => {
  // Check email uniqueness
  const existingEmail = await User.findOne({ where: { email: payload.email.toLowerCase() } });
  if (existingEmail) {
    throw new ConflictError(`An employee with email '${payload.email}' already exists`);
  }

  // Check or generate employeeCode
  let code = payload.employeeCode ? payload.employeeCode.toUpperCase() : null;
  if (code) {
    const existingCode = await User.findOne({ where: { employeeCode: code } });
    if (existingCode) {
      throw new ConflictError(`Employee code '${code}' is already assigned to another employee`);
    }
  } else {
    code = await generateEmployeeCode();
  }

  // Validate and sync Department
  let departmentName = payload.department || 'General';
  if (payload.departmentId) {
    const dept = await Department.findByPk(payload.departmentId);
    if (!dept) throw new NotFoundError(`Department not found with ID ${payload.departmentId}`);
    departmentName = dept.name;
  }

  // Validate and sync Designation
  let designationTitle = payload.designation || null;
  if (payload.designationId) {
    const desig = await Designation.findByPk(payload.designationId);
    if (!desig) throw new NotFoundError(`Designation not found with ID ${payload.designationId}`);
    designationTitle = desig.title;
  }

  // Validate Branch
  if (payload.branchId) {
    const branch = await Branch.findByPk(payload.branchId);
    if (!branch) throw new NotFoundError(`Branch not found with ID ${payload.branchId}`);
  }

  // Validate Manager
  if (payload.managerId) {
    const manager = await User.findByPk(payload.managerId);
    if (!manager) throw new NotFoundError(`Manager not found with ID ${payload.managerId}`);
  }

  // Validate & sync Role
  let roleName = payload.role || ROLES.EMPLOYEE;
  let roleId = payload.roleId || null;
  if (roleId) {
    const roleRecord = await Role.findByPk(roleId);
    if (!roleRecord) throw new NotFoundError(`Role not found with ID ${roleId}`);
    roleName = roleRecord.name;
  } else {
    const roleRecord = await Role.findOne({ where: { name: roleName } });
    if (roleRecord) {
      roleId = roleRecord.id;
    }
  }

  const plainPassword = payload.password || 'Employee@123';

  // Transaction for creating employee + seeding initial leave balances + logging
  const result = await sequelize.transaction(async (t) => {
    const newEmployee = await User.create(
      {
        ...payload,
        email: payload.email.toLowerCase(),
        employeeCode: code,
        role: roleName,
        roleId,
        department: departmentName,
        designation: designationTitle,
        password: plainPassword,
        status: payload.status || USER_STATUS.ACTIVE
      },
      { transaction: t }
    );

    // Initialize default leave balances for current calendar year
    const leaveTypes = await LeaveType.findAll({ transaction: t });
    if (leaveTypes && leaveTypes.length > 0) {
      const currentYear = new Date().getFullYear();
      const balancesToInsert = leaveTypes.map((lt) => ({
        userId: newEmployee.id,
        leaveTypeId: lt.id,
        year: currentYear,
        allocated: lt.daysPerYear || 12,
        used: 0,
        remaining: lt.daysPerYear || 12
      }));
      await LeaveBalance.bulkCreate(balancesToInsert, { transaction: t });
    }

    // Initialize initial SalaryStructure if salary/CTC is specified
    if (payload.salary && Number(payload.salary) > 0) {
      const ctcVal = Number(payload.salary);
      const monthlyGross = ctcVal / 12;
      const basicVal = Math.round(monthlyGross * 0.5);
      const hraVal = Math.round(monthlyGross * 0.2);
      const allowanceVal = Math.max(0, Math.round(monthlyGross - basicVal - hraVal));
      const pfVal = Math.round(basicVal * 0.12);
      const netVal = Math.max(0, monthlyGross - pfVal);

      await SalaryStructure.create(
        {
          userId: newEmployee.id,
          ctc: ctcVal,
          basicSalary: basicVal,
          hra: hraVal,
          specialAllowance: allowanceVal,
          pfDeduction: pfVal,
          esiDeduction: 0,
          taxDeduction: 0,
          netSalary: netVal
        },
        { transaction: t }
      ).catch((err) => logger.warn('Initial salary structure warning:', err.message));
    }

    // Log creation in ActivityLog
    await ActivityLog.create(
      {
        userId: actor ? actor.id : newEmployee.id,
        action: 'CREATE_EMPLOYEE',
        module: 'EMPLOYEE',
        targetId: newEmployee.id,
        ipAddress: 'INTERNAL',
        details: `Registered new employee ${newEmployee.firstName} ${newEmployee.lastName} (${code})`
      },
      { transaction: t }
    );

    // Create system notification
    await Notification.create(
      {
        userId: newEmployee.id,
        title: 'Welcome to the Team!',
        message: `Your employee profile has been created successfully with employee code ${code}.`,
        type: 'info'
      },
      { transaction: t }
    );

    return newEmployee;
  });

  // Send onboarding email asynchronously
  sendWelcomeEmail({
    to: result.email,
    name: `${result.firstName} ${result.lastName}`,
    temporaryPassword: plainPassword,
    role: result.role
  }).catch((err) => logger.warn('Employee welcome email warning:', err.message));

  return result.toSafeJSON();
};

/**
 * 2. Get all employees with pagination, search, and multidimensional filters
 */
const getAllEmployees = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const {
    search,
    departmentId,
    designationId,
    branchId,
    roleId,
    role,
    status,
    gender,
    sortBy = 'createdAt',
    order = 'DESC'
  } = query;

  const where = {};

  if (search) {
    const s = `%${search}%`;
    where[Op.or] = [
      { firstName: { [Op.like]: s } },
      { lastName: { [Op.like]: s } },
      { email: { [Op.like]: s } },
      { employeeCode: { [Op.like]: s } },
      { phone: { [Op.like]: s } }
    ];
  }

  if (departmentId) where.departmentId = departmentId;
  if (designationId) where.designationId = designationId;
  if (branchId) where.branchId = branchId;
  if (roleId) where.roleId = roleId;
  if (role) where.role = role;
  if (status) where.status = status;
  if (gender) where.gender = gender;

  const { count, rows } = await User.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sortBy, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
    attributes: {
      exclude: ['password', 'refreshToken', 'resetPasswordToken', 'resetPasswordExpires']
    },
    include: [
      {
        model: Department,
        as: 'departmentDetails',
        attributes: ['id', 'name', 'code']
      },
      {
        model: Designation,
        as: 'designationDetails',
        attributes: ['id', 'title', 'code']
      },
      {
        model: Branch,
        as: 'branchDetails',
        attributes: ['id', 'name', 'city', 'country']
      },
      {
        model: Role,
        as: 'roleDetails',
        attributes: ['id', 'name', 'displayName']
      },
      {
        model: User,
        as: 'manager',
        attributes: ['id', 'firstName', 'lastName', 'email', 'employeeCode']
      }
    ]
  });

  return {
    rows,
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  };
};

/**
 * 3. Complete 360-degree employee profile view
 */
const getEmployee360Profile = async (id) => {
  const employee = await User.findByPk(id, {
    attributes: {
      exclude: ['password', 'refreshToken', 'resetPasswordToken', 'resetPasswordExpires']
    },
    include: [
      {
        model: Department,
        as: 'departmentDetails',
        attributes: ['id', 'name', 'code', 'description']
      },
      {
        model: Designation,
        as: 'designationDetails',
        attributes: ['id', 'title', 'code', 'department']
      },
      {
        model: Branch,
        as: 'branchDetails',
        attributes: ['id', 'name', 'city', 'state', 'country', 'address']
      },
      {
        model: Role,
        as: 'roleDetails',
        attributes: ['id', 'name', 'displayName', 'description']
      },
      {
        model: User,
        as: 'manager',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'employeeCode', 'designation']
      },
      {
        model: User,
        as: 'reportees',
        attributes: ['id', 'firstName', 'lastName', 'email', 'employeeCode', 'designation', 'status']
      },
      {
        model: LeaveBalance,
        as: 'leaveBalances',
        attributes: ['id', 'year', 'allocated', 'used', 'remaining'],
        include: [
          {
            model: LeaveType,
            as: 'leaveType',
            attributes: ['id', 'name', 'code', 'isPaid']
          }
        ]
      },
      {
        model: CompanyAsset,
        as: 'assignedAssets',
        attributes: ['id', 'assetName', 'serialNumber', 'category', 'assignedDate', 'status']
      },
      {
        model: EmployeeDocument,
        as: 'documents',
        attributes: ['id', 'documentType', 'title', 'fileUrl', 'verificationStatus', 'createdAt']
      },
      {
        model: SalaryStructure,
        as: 'salaryStructure',
        attributes: ['id', 'ctc', 'basicSalary', 'hra', 'specialAllowance', 'pfDeduction', 'netSalary']
      }
    ]
  });

  if (!employee) {
    throw new NotFoundError(`Employee not found with ID ${id}`);
  }

  // Fetch recent attendance history (last 5 records)
  const recentAttendances = await Attendance.findAll({
    where: { userId: id },
    order: [['date', 'DESC']],
    limit: 5,
    include: [{ model: Shift, as: 'shift', attributes: ['id', 'name', 'startTime', 'endTime'] }]
  });

  const profileData = employee.toJSON();
  profileData.recentAttendances = recentAttendances;

  return profileData;
};

/**
 * 4. Update employee details with integrity and uniqueness checks
 */
const updateEmployee = async (id, payload, actor = null) => {
  const employee = await User.findByPk(id);
  if (!employee) {
    throw new NotFoundError(`Employee not found with ID ${id}`);
  }

  // Prevent circular or self-reporting manager
  if (payload.managerId !== undefined) {
    if (payload.managerId === id) {
      throw new BadRequestError('An employee cannot be designated as their own reporting manager');
    }
    if (payload.managerId !== null) {
      const manager = await User.findByPk(payload.managerId);
      if (!manager) throw new NotFoundError(`Manager not found with ID ${payload.managerId}`);
    }
    employee.managerId = payload.managerId;
  }

  // Check unique email if updating email
  if (payload.email && payload.email.toLowerCase() !== employee.email) {
    const existingEmail = await User.findOne({ where: { email: payload.email.toLowerCase() } });
    if (existingEmail && existingEmail.id !== id) {
      throw new ConflictError(`Email '${payload.email}' is already taken by another employee`);
    }
    employee.email = payload.email.toLowerCase();
  }

  // Check unique employee code if updating
  if (payload.employeeCode && payload.employeeCode.toUpperCase() !== employee.employeeCode) {
    const code = payload.employeeCode.toUpperCase();
    const existingCode = await User.findOne({ where: { employeeCode: code } });
    if (existingCode && existingCode.id !== id) {
      throw new ConflictError(`Employee code '${code}' is already assigned to another user`);
    }
    employee.employeeCode = code;
  }

  // Sync Department
  if (payload.departmentId !== undefined) {
    if (payload.departmentId !== null) {
      const dept = await Department.findByPk(payload.departmentId);
      if (!dept) throw new NotFoundError(`Department not found with ID ${payload.departmentId}`);
      employee.department = dept.name;
    }
    employee.departmentId = payload.departmentId;
  } else if (payload.department) {
    employee.department = payload.department;
  }

  // Sync Designation
  if (payload.designationId !== undefined) {
    if (payload.designationId !== null) {
      const desig = await Designation.findByPk(payload.designationId);
      if (!desig) throw new NotFoundError(`Designation not found with ID ${payload.designationId}`);
      employee.designation = desig.title;
    } else {
      employee.designation = null;
    }
    employee.designationId = payload.designationId;
  } else if (payload.designation !== undefined) {
    employee.designation = payload.designation;
  }

  // Sync Branch
  if (payload.branchId !== undefined) {
    if (payload.branchId !== null) {
      const branch = await Branch.findByPk(payload.branchId);
      if (!branch) throw new NotFoundError(`Branch not found with ID ${payload.branchId}`);
    }
    employee.branchId = payload.branchId;
  }

  // Sync Role
  if (payload.roleId !== undefined) {
    if (payload.roleId !== null) {
      const roleRecord = await Role.findByPk(payload.roleId);
      if (!roleRecord) throw new NotFoundError(`Role not found with ID ${payload.roleId}`);
      employee.role = roleRecord.name;
    }
    employee.roleId = payload.roleId;
  } else if (payload.role) {
    employee.role = payload.role;
  }

  // Update scalar fields
  const scalarFields = ['firstName', 'lastName', 'phone', 'joiningDate', 'salary', 'dob', 'gender', 'status'];
  scalarFields.forEach((field) => {
    if (payload[field] !== undefined) {
      employee[field] = payload[field];
    }
  });

  await employee.save();

  // Log activity
  await ActivityLog.create({
    userId: actor ? actor.id : employee.id,
    action: 'UPDATE_EMPLOYEE',
    module: 'EMPLOYEE',
    targetId: employee.id,
    ipAddress: 'INTERNAL',
    details: `Updated details for employee ${employee.firstName} ${employee.lastName} (${employee.employeeCode})`
  }).catch((err) => logger.warn('ActivityLog warning:', err.message));

  return employee.toSafeJSON();
};

/**
 * 5. Change employee status (Active, Probation, Notice Period, Suspended, Terminated, Resigned) with mandatory reason audit
 */
const changeEmployeeStatus = async (id, { status, reason, effectiveDate }, actor = null) => {
  const employee = await User.findByPk(id);
  if (!employee) {
    throw new NotFoundError(`Employee not found with ID ${id}`);
  }

  if (employee.status === status) {
    throw new BadRequestError(`Employee is already in '${status}' status`);
  }

  const previousStatus = employee.status;
  employee.status = status;

  // Revoke active sessions if account is suspended, terminated, or resigned
  if ([USER_STATUS.SUSPENDED, USER_STATUS.TERMINATED, USER_STATUS.RESIGNED, USER_STATUS.INACTIVE].includes(status)) {
    employee.refreshToken = null;
  }

  await employee.save();

  // Record Audit Trail in ActivityLog
  await ActivityLog.create({
    userId: actor ? actor.id : employee.id,
    action: 'EMPLOYEE_STATUS_CHANGE',
    module: 'EMPLOYEE',
    targetId: employee.id,
    ipAddress: 'INTERNAL',
    details: `Status changed from '${previousStatus}' to '${status}'. Reason: ${reason || 'N/A'}`
  }).catch((err) => logger.warn('ActivityLog warning:', err.message));

  // Send Notification to Employee
  await Notification.create({
    userId: employee.id,
    title: 'Employment Status Update',
    message: `Your employment status has been transitioned to '${status}'. ${reason ? 'Reason: ' + reason : ''}`,
    type: [USER_STATUS.SUSPENDED, USER_STATUS.TERMINATED].includes(status) ? 'warning' : 'info'
  }).catch((err) => logger.warn('Notification warning:', err.message));

  return {
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    fullName: `${employee.firstName} ${employee.lastName}`,
    previousStatus,
    currentStatus: employee.status,
    reason: reason || null,
    effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
    sessionTerminated: [USER_STATUS.SUSPENDED, USER_STATUS.TERMINATED, USER_STATUS.RESIGNED].includes(status)
  };
};

/**
 * 6. Real-time pulse check: Account status + today's attendance + active leave + shift details
 */
const getEmployeeRealTimeStatus = async (id) => {
  const employee = await User.findByPk(id, {
    attributes: ['id', 'firstName', 'lastName', 'email', 'employeeCode', 'status', 'phone', 'avatar'],
    include: [
      { model: Designation, as: 'designationDetails', attributes: ['id', 'title', 'code'] },
      { model: Department, as: 'departmentDetails', attributes: ['id', 'name', 'code'] },
      { model: Branch, as: 'branchDetails', attributes: ['id', 'name', 'city'] }
    ]
  });

  if (!employee) {
    throw new NotFoundError(`Employee not found with ID ${id}`);
  }

  const today = new Date().toISOString().split('T')[0];

  // 1. Check if today is a public holiday
  const holiday = await Holiday.findOne({
    where: { date: today }
  });

  // 2. Check if employee is on an approved leave today
  const activeLeave = await LeaveRequest.findOne({
    where: {
      userId: id,
      status: 'approved',
      startDate: { [Op.lte]: today },
      endDate: { [Op.gte]: today }
    },
    include: [{ model: LeaveType, as: 'leaveType', attributes: ['id', 'name', 'code'] }]
  });

  // 3. Check today's attendance record
  const attendance = await Attendance.findOne({
    where: {
      userId: id,
      date: today
    },
    include: [{ model: Shift, as: 'shift', attributes: ['id', 'name', 'startTime', 'endTime'] }]
  });

  // Calculate Real-time dynamic working pulse
  let realTimePulse = 'not_clocked_in';
  let isClockedIn = false;

  if ([USER_STATUS.SUSPENDED, USER_STATUS.TERMINATED, USER_STATUS.RESIGNED, USER_STATUS.INACTIVE].includes(employee.status)) {
    realTimePulse = employee.status;
  } else if (activeLeave) {
    realTimePulse = 'on_leave';
  } else if (holiday) {
    realTimePulse = 'holiday';
  } else if (attendance) {
    if (attendance.clockOut) {
      realTimePulse = 'clocked_out';
    } else if (attendance.clockIn) {
      realTimePulse = 'clocked_in';
      isClockedIn = true;
    } else {
      realTimePulse = attendance.status || 'not_clocked_in';
    }
  }

  return {
    employee: {
      id: employee.id,
      employeeCode: employee.employeeCode,
      fullName: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      avatar: employee.avatar,
      designation: employee.designationDetails ? employee.designationDetails.title : null,
      department: employee.departmentDetails ? employee.departmentDetails.name : null,
      branch: employee.branchDetails ? employee.branchDetails.name : null,
      employmentStatus: employee.status,
      isAccountActive: [USER_STATUS.ACTIVE, USER_STATUS.PROBATION, USER_STATUS.NOTICE_PERIOD].includes(employee.status)
    },
    realTimePulse,
    isClockedIn,
    todayDate: today,
    attendanceToday: attendance
      ? {
          attendanceId: attendance.id,
          status: attendance.status,
          clockIn: attendance.clockIn,
          clockInTime: attendance.clockIn,
          clockOut: attendance.clockOut,
          clockOutTime: attendance.clockOut,
          totalHours: attendance.totalHours,
          shift: attendance.shift ? attendance.shift.name : null
        }
      : null,
    activeLeaveToday: activeLeave
      ? {
          requestId: activeLeave.id,
          leaveType: activeLeave.leaveType ? activeLeave.leaveType.name : null,
          startDate: activeLeave.startDate,
          endDate: activeLeave.endDate,
          reason: activeLeave.reason
        }
      : null,
    holidayToday: holiday
      ? {
          holidayId: holiday.id,
          title: holiday.title,
          type: holiday.type
        }
      : null
  };
};

/**
 * 7. Get logged-in employee's own profile (self-service)
 */
const getMyProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: {
      exclude: ['password', 'refreshToken', 'resetPasswordToken', 'resetPasswordExpires']
    },
    include: [
      { model: Department, as: 'departmentDetails', attributes: ['id', 'name'] },
      { model: Designation, as: 'designationDetails', attributes: ['id', 'title'] },
      { model: Branch, as: 'branchDetails', attributes: ['id', 'name', 'city'] },
      {
        model: User,
        as: 'manager',
        attributes: ['id', 'firstName', 'lastName', 'email', 'designation', 'avatar']
      }
    ]
  });

  if (!user) throw new NotFoundError('Employee profile not found');
  return user;
};

/**
 * 8. Update logged-in employee's own editable profile fields (self-service)
 */
const updateMyProfile = async (userId, payload) => {
  // Strict whitelist — employee cannot change admin-controlled fields
  const ALLOWED_FIELDS = ['phone', 'address', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation', 'bankAccountNumber', 'bankName', 'bankIfsc'];

  const updateData = {};
  ALLOWED_FIELDS.forEach((field) => {
    if (payload[field] !== undefined) {
      updateData[field] = payload[field];
    }
  });

  // Support frontend emergencyContact alias
  if (payload.emergencyContact !== undefined && updateData.emergencyContactName === undefined) {
    updateData.emergencyContactName = payload.emergencyContact;
  }

  if (Object.keys(updateData).length === 0) {
    throw new BadRequestError('No valid fields provided to update');
  }

  await User.update(updateData, { where: { id: userId } });
  return getMyProfile(userId);
};

/**
 * 9. Update / Upsert employee salary structure
 */
const updateEmployeeSalaryStructure = async (id, payload, actor = null) => {
  const employee = await User.findByPk(id);
  if (!employee) {
    throw new NotFoundError(`Employee not found with ID ${id}`);
  }

  const ctc = parseFloat(payload.ctc || 0);
  const monthlyGross = ctc > 0 ? ctc / 12 : 0;
  const basicSalary = payload.basicSalary !== undefined && payload.basicSalary !== null
    ? parseFloat(payload.basicSalary)
    : Math.round(monthlyGross * 0.5);
  const hra = payload.hra !== undefined && payload.hra !== null
    ? parseFloat(payload.hra)
    : Math.round(monthlyGross * 0.2);
  const specialAllowance = payload.specialAllowance !== undefined && payload.specialAllowance !== null
    ? parseFloat(payload.specialAllowance)
    : Math.max(0, Math.round(monthlyGross - basicSalary - hra));
  const pfDeduction = payload.pfDeduction !== undefined && payload.pfDeduction !== null
    ? parseFloat(payload.pfDeduction)
    : Math.round(basicSalary * 0.12);
  const esiDeduction = payload.esiDeduction !== undefined && payload.esiDeduction !== null
    ? parseFloat(payload.esiDeduction)
    : 0;
  const taxDeduction = payload.taxDeduction !== undefined && payload.taxDeduction !== null
    ? parseFloat(payload.taxDeduction)
    : 0;
  const calculatedNet = Math.max(0, Math.round((basicSalary + hra + specialAllowance) - (pfDeduction + esiDeduction + taxDeduction)));
  const netSalary = payload.netSalary !== undefined && payload.netSalary !== null
    ? parseFloat(payload.netSalary)
    : calculatedNet;

  const result = await sequelize.transaction(async (t) => {
    // 1. Sync User salary
    employee.salary = ctc;
    await employee.save({ transaction: t });

    // 2. Find or create SalaryStructure
    const [structure, created] = await SalaryStructure.findOrCreate({
      where: { userId: id },
      defaults: {
        userId: id,
        ctc,
        basicSalary,
        hra,
        specialAllowance,
        pfDeduction,
        esiDeduction,
        taxDeduction,
        netSalary
      },
      transaction: t
    });

    if (!created) {
      await structure.update(
        {
          ctc,
          basicSalary,
          hra,
          specialAllowance,
          pfDeduction,
          esiDeduction,
          taxDeduction,
          netSalary
        },
        { transaction: t }
      );
    }

    // 3. Log Activity
    await ActivityLog.create(
      {
        userId: actor ? actor.id : employee.id,
        action: 'UPDATE_SALARY_STRUCTURE',
        module: 'PAYROLL',
        targetId: employee.id,
        ipAddress: 'INTERNAL',
        details: `Updated salary structure for ${employee.firstName} ${employee.lastName}: CTC ₹${ctc.toLocaleString()}, Net ₹${netSalary.toLocaleString()}/mo`
      },
      { transaction: t }
    ).catch(() => {});

    return structure;
  });

  return result;
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployee360Profile,
  updateEmployee,
  changeEmployeeStatus,
  getEmployeeRealTimeStatus,
  getMyProfile,
  updateMyProfile,
  updateEmployeeSalaryStructure
};
