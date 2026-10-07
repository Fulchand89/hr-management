const { Op } = require('sequelize');
const {
  Attendance,
  LeaveRequest,
  LeaveType,
  LeaveBalance,
  AttendanceCorrection,
  User,
  Department,
  Designation
} = require('../models');
const { BadRequestError, NotFoundError } = require('../utils/apiError');

/**
 * Helper to convert array of objects to CSV string
 */
const convertToCSV = (headers, rows) => {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };
  const headerLine = headers.map((h) => escapeCell(h.label || h.key)).join(',');
  const rowLines = rows.map((r) => headers.map((h) => escapeCell(r[h.key])).join(','));
  return [headerLine, ...rowLines].join('\r\n');
};

/**
 * Helper: Resolve start and end dates from query or current month
 */
const resolveDateRange = (startDate, endDate) => {
  const now = new Date();
  const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  return { start, end };
};

/**
 * 1. Attendance Report (Daily, Monthly, Late, Early, All)
 */
const getAttendanceReport = async (query = {}) => {
  const { start, end } = resolveDateRange(query.startDate, query.endDate);

  const where = {
    date: {
      [Op.between]: [start, end]
    }
  };

  if (query.status && query.status !== 'all') {
    where.status = query.status;
  }

  if (query.type === 'late') {
    where.status = 'late';
  } else if (query.type === 'half-day' || query.type === 'half_day') {
    where.status = 'half_day';
  }

  const userWhere = {};
  if (query.departmentId) {
    userWhere.departmentId = query.departmentId;
  }
  if (query.department && query.department !== 'All Departments') {
    userWhere.department = query.department;
  }

  const attendances = await Attendance.findAll({
    where,
    order: [['date', 'ASC'], ['createdAt', 'ASC']],
    include: [
      {
        model: User,
        as: 'user',
        where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
        attributes: ['id', 'firstName', 'lastName', 'employeeCode', 'department', 'designation', 'email']
      }
    ]
  });

  // Calculate summary metrics
  let presentCount = 0;
  let lateCount = 0;
  let halfDayCount = 0;
  let absentCount = 0;
  let totalHoursSum = 0;

  const records = attendances.map((att) => {
    const hours = parseFloat(att.totalHours) || 0;
    totalHoursSum += hours;

    if (att.status === 'present') presentCount++;
    else if (att.status === 'late') {
      presentCount++;
      lateCount++;
    } else if (att.status === 'half_day') {
      presentCount++;
      halfDayCount++;
    } else if (att.status === 'absent') {
      absentCount++;
    }

    const clockInStr = att.clockIn ? new Date(att.clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--';
    const clockOutStr = att.clockOut ? new Date(att.clockOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--';

    return {
      id: att.id,
      date: att.date,
      employeeId: att.user?.employeeCode || 'N/A',
      employeeName: att.user ? `${att.user.firstName} ${att.user.lastName || ''}`.trim() : 'Unknown',
      department: att.user?.department || 'General',
      designation: att.user?.designation || '--',
      clockIn: clockInStr,
      clockOut: clockOutStr,
      totalHours: hours.toFixed(2),
      status: att.status,
      remarks: att.remarks || ''
    };
  });

  if (query.format === 'csv') {
    const headers = [
      { key: 'date', label: 'Date' },
      { key: 'employeeId', label: 'Employee Code' },
      { key: 'employeeName', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'designation', label: 'Designation' },
      { key: 'clockIn', label: 'Check In' },
      { key: 'clockOut', label: 'Check Out' },
      { key: 'totalHours', label: 'Total Hours' },
      { key: 'status', label: 'Status' },
      { key: 'remarks', label: 'Remarks' }
    ];
    return {
      format: 'csv',
      data: convertToCSV(headers, records),
      filename: `attendance-report-${start}-to-${end}.csv`
    };
  }

  return {
    format: 'json',
    period: { startDate: start, endDate: end },
    summary: {
      totalRecords: records.length,
      presentCount,
      lateCount,
      halfDayCount,
      absentCount,
      totalWorkingHours: totalHoursSum.toFixed(2)
    },
    records
  };
};

/**
 * 2. Leave Report
 */
const getLeaveReport = async (query = {}) => {
  const { start, end } = resolveDateRange(query.startDate, query.endDate);

  const where = {
    [Op.or]: [
      { startDate: { [Op.between]: [start, end] } },
      { endDate: { [Op.between]: [start, end] } }
    ]
  };

  if (query.status && query.status !== 'all') {
    where.status = query.status;
  }
  if (query.leaveTypeId) {
    where.leaveTypeId = query.leaveTypeId;
  }

  const userWhere = {};
  if (query.departmentId) {
    userWhere.departmentId = query.departmentId;
  }
  if (query.department && query.department !== 'All Departments') {
    userWhere.department = query.department;
  }

  const leaves = await LeaveRequest.findAll({
    where,
    order: [['startDate', 'ASC']],
    include: [
      {
        model: User,
        as: 'applicant',
        where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
        attributes: ['id', 'firstName', 'lastName', 'employeeCode', 'department']
      },
      {
        model: LeaveType,
        as: 'leaveType',
        attributes: ['id', 'name', 'code']
      }
    ]
  });

  let approvedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;
  let totalDaysTaken = 0;
  const typeMap = {};

  const records = leaves.map((l) => {
    const days = parseFloat(l.totalDays) || 0;
    if (l.status === 'approved') {
      approvedCount++;
      totalDaysTaken += days;
    } else if (l.status === 'pending') {
      pendingCount++;
    } else if (l.status === 'rejected') {
      rejectedCount++;
    }

    const typeName = l.leaveType?.name || 'Other';
    if (!typeMap[typeName]) {
      typeMap[typeName] = { count: 0, days: 0 };
    }
    typeMap[typeName].count++;
    if (l.status === 'approved') {
      typeMap[typeName].days += days;
    }

    return {
      id: l.id,
      employeeId: l.applicant?.employeeCode || 'N/A',
      employeeName: l.applicant ? `${l.applicant.firstName} ${l.applicant.lastName || ''}`.trim() : 'Unknown',
      department: l.applicant?.department || 'General',
      leaveType: typeName,
      startDate: l.startDate,
      endDate: l.endDate,
      totalDays: days,
      reason: l.reason,
      status: l.status,
      actionReason: l.actionReason || ''
    };
  });

  const byType = Object.keys(typeMap).map((k) => ({
    leaveType: k,
    applications: typeMap[k].count,
    daysConsumed: typeMap[k].days
  }));

  if (query.format === 'csv') {
    const headers = [
      { key: 'employeeId', label: 'Employee Code' },
      { key: 'employeeName', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'leaveType', label: 'Leave Type' },
      { key: 'startDate', label: 'Start Date' },
      { key: 'endDate', label: 'End Date' },
      { key: 'totalDays', label: 'Days' },
      { key: 'status', label: 'Status' },
      { key: 'reason', label: 'Reason' }
    ];
    return {
      format: 'csv',
      data: convertToCSV(headers, records),
      filename: `leave-report-${start}-to-${end}.csv`
    };
  }

  return {
    format: 'json',
    period: { startDate: start, endDate: end },
    summary: {
      totalApplications: records.length,
      approvedCount,
      pendingCount,
      rejectedCount,
      totalDaysApproved: totalDaysTaken
    },
    byType,
    records
  };
};

/**
 * 3. Employee Summary Report (Individual complete month dossier)
 */
const getEmployeeSummaryReport = async (query = {}) => {
  const userId = query.userId || query.employeeId;
  if (!userId) {
    throw new BadRequestError('User ID or Employee ID is required for employee-wise report');
  }

  const now = new Date();
  const month = parseInt(query.month, 10) || now.getMonth() + 1;
  const year = parseInt(query.year, 10) || now.getFullYear();

  // Find user
  const user = await User.findOne({
    where: {
      [Op.or]: [
        { id: userId },
        { employeeCode: userId }
      ]
    },
    include: [
      { model: Department, as: 'departmentDetails', attributes: ['name', 'code'] },
      { model: Designation, as: 'designationDetails', attributes: ['title'] }
    ]
  });

  if (!user) {
    throw new NotFoundError(`Employee not found with identifier ${userId}`);
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Fetch attendances, leaves, balances, and corrections in parallel
  const [attendances, leaveBalances, leaves, corrections] = await Promise.all([
    Attendance.findAll({
      where: {
        userId: user.id,
        date: { [Op.between]: [startDate, endDate] }
      },
      order: [['date', 'ASC']]
    }),
    LeaveBalance.findAll({
      where: { userId: user.id },
      include: [{ model: LeaveType, as: 'leaveType', attributes: ['name', 'code'] }]
    }),
    LeaveRequest.findAll({
      where: {
        userId: user.id,
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } }
        ]
      },
      include: [{ model: LeaveType, as: 'leaveType', attributes: ['name'] }]
    }),
    AttendanceCorrection.findAll({
      where: {
        userId: user.id,
        date: { [Op.between]: [startDate, endDate] }
      }
    })
  ]);

  let presentDays = 0;
  let lateDays = 0;
  let halfDayDays = 0;
  let absentDays = 0;
  let totalHours = 0;

  const attendanceRecords = attendances.map((a) => {
    const hours = parseFloat(a.totalHours) || 0;
    totalHours += hours;
    if (a.status === 'present') presentDays++;
    else if (a.status === 'late') {
      presentDays++;
      lateDays++;
    } else if (a.status === 'half_day') {
      presentDays++;
      halfDayDays++;
    } else if (a.status === 'absent') absentDays++;

    return {
      date: a.date,
      clockIn: a.clockIn ? new Date(a.clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--',
      clockOut: a.clockOut ? new Date(a.clockOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--',
      totalHours: hours.toFixed(2),
      status: a.status
    };
  });

  const formattedBalances = leaveBalances.map((b) => ({
    leaveType: b.leaveType?.name || 'Leave',
    allocated: parseFloat(b.allocated) || 0,
    used: parseFloat(b.used) || 0,
    remaining: parseFloat(b.remaining) || 0
  }));

  if (query.format === 'csv') {
    const headers = [
      { key: 'date', label: 'Date' },
      { key: 'clockIn', label: 'Check In' },
      { key: 'clockOut', label: 'Check Out' },
      { key: 'totalHours', label: 'Hours' },
      { key: 'status', label: 'Status' }
    ];
    return {
      format: 'csv',
      data: convertToCSV(headers, attendanceRecords),
      filename: `employee-${user.employeeCode || user.id}-${year}-${month}.csv`
    };
  }

  return {
    format: 'json',
    period: { month, year, startDate, endDate },
    employee: {
      id: user.id,
      employeeCode: user.employeeCode,
      name: `${user.firstName} ${user.lastName || ''}`.trim(),
      email: user.email,
      department: user.department || user.departmentDetails?.name || 'General',
      designation: user.designation || user.designationDetails?.title || 'Staff'
    },
    attendanceSummary: {
      totalRecordedDays: attendances.length,
      presentDays,
      lateDays,
      halfDayDays,
      absentDays,
      totalHours: totalHours.toFixed(2),
      avgDailyHours: presentDays > 0 ? (totalHours / presentDays).toFixed(2) : '0.00'
    },
    attendanceRecords,
    leaveBalances: formattedBalances,
    leavesTaken: leaves.map((l) => ({
      id: l.id,
      leaveType: l.leaveType?.name || 'Leave',
      startDate: l.startDate,
      endDate: l.endDate,
      totalDays: l.totalDays,
      status: l.status,
      reason: l.reason
    })),
    corrections: corrections.map((c) => ({
      id: c.id,
      date: c.date,
      type: c.punchType,
      requestedTime: c.requestedTime,
      status: c.status
    }))
  };
};

module.exports = {
  getAttendanceReport,
  getLeaveReport,
  getEmployeeSummaryReport
};
