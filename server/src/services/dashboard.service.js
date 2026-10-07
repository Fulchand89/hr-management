const attendanceService = require('./attendance.service');
const notificationService = require('./notification.service');
const {
  User,
  Attendance,
  AttendanceCorrection,
  LeaveRequest,
  LeaveBalance,
  LeaveType,
  Holiday,
  Department
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

/**
 * Get full dashboard summary for a logged-in employee
 * Aggregates: attendance, leave balance, notifications, upcoming holidays
 */
const getEmployeeDashboard = async (userId) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Run all queries in parallel for speed
  const [todayAttendance, leaveBalances, unreadCount, upcomingHolidays, monthHistory] = await Promise.all([
    // 1. Today's attendance status
    attendanceService.getTodayStatus(userId).catch((err) => {
      logger.warn('Dashboard: attendance fetch error:', err.message);
      return null;
    }),

    // 2. Leave balances with type details
    LeaveBalance.findAll({
      where: { userId },
      include: [
        {
          model: LeaveType,
          as: 'leaveType',
          attributes: ['id', 'name', 'code']
        }
      ]
    }).catch(() => []),

    // 3. Unread notification count
    notificationService.getUnreadCount(userId).catch(() => ({ unreadCount: 0 })),

    // 4. Upcoming holidays (next 3)
    Holiday.findAll({
      where: {
        date: { [Op.gte]: todayStr }
      },
      order: [['date', 'ASC']],
      limit: 3
    }).catch(() => []),

    // 5. Monthly attendance history & summary
    attendanceService.getMyAttendanceHistory(userId, {
      month: today.getMonth() + 1,
      year: today.getFullYear()
    }).catch(() => null)
  ]);

  // Format leave balances
  const formattedLeaveBalances = leaveBalances.map((lb) => {
    const allocated = parseFloat(lb.allocated) || 0;
    const used = parseFloat(lb.used) || 0;
    const remaining = lb.remaining !== undefined && lb.remaining !== null
      ? parseFloat(lb.remaining)
      : Math.max(0, allocated - used);

    return {
      leaveTypeId: lb.leaveTypeId,
      leaveTypeName: lb.leaveType ? lb.leaveType.name : 'Unknown',
      leaveTypeCode: lb.leaveType ? lb.leaveType.code : '',
      allocated,
      used,
      remaining,
      totalDays: allocated,
      usedDays: used,
      remainingDays: remaining
    };
  });

  // Format upcoming holidays
  const formattedHolidays = upcomingHolidays.map((h) => {
    const holidayDate = new Date(h.date);
    const diffMs = holidayDate - today;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return {
      id: h.id,
      title: h.title || h.name,
      date: h.date,
      type: h.type,
      daysLeft: diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`
    };
  });

  // Format recent 5 logs from monthHistory
  const recentLogs = monthHistory && Array.isArray(monthHistory.records)
    ? monthHistory.records.slice(-5).reverse().map((r) => {
        const d = new Date(r.date);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const hours = parseFloat(r.totalHours) || 0;
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        const durationStr = hours > 0 ? `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m` : '--';
        
        let statusLabel = 'Present';
        if (r.status === 'absent') statusLabel = 'Absent';
        else if (r.status === 'half_day') statusLabel = 'Half Day';
        else if (r.status === 'late') statusLabel = 'Late';
        else if (r.status === 'on_leave') statusLabel = 'On Leave';

        return {
          id: r.id,
          date: dateStr,
          day: dayName,
          in: r.clockInFormatted || '--:--',
          out: r.clockOutFormatted || '--:--',
          duration: durationStr,
          status: statusLabel
        };
      })
    : [];

  return {
    attendance: todayAttendance,
    recentLogs,
    attendanceSummary: monthHistory ? monthHistory.summary : null,
    leaveBalances: formattedLeaveBalances,
    notifications: unreadCount,
    upcomingHolidays: formattedHolidays
  };
};

/**
 * Get full HR / Admin dashboard summary
 * Aggregates workforce metrics, attendance status, pending approvals & queues
 */
const getHRDashboard = async (userId) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [
    totalEmployees,
    todayAttendances,
    onLeaveTodayCount,
    pendingLeavesCount,
    pendingCorrectionsCount,
    recentLeaves,
    recentCorrections,
    upcomingHolidays,
    departments,
    personalTodayAttendance,
    personalMonthHistory
  ] = await Promise.all([
    // 1. Total active employees
    User.count({
      where: { status: 'active' }
    }).catch(() => 0),

    // 2. Today's attendance records
    Attendance.findAll({
      where: { date: todayStr },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'department', 'departmentId']
        }
      ]
    }).catch(() => []),

    // 3. Approved leaves covering today
    LeaveRequest.count({
      where: {
        status: 'approved',
        startDate: { [Op.lte]: todayStr },
        endDate: { [Op.gte]: todayStr }
      }
    }).catch(() => 0),

    // 4. Pending leave applications count
    LeaveRequest.count({
      where: { status: 'pending' }
    }).catch(() => 0),

    // 5. Pending attendance corrections count
    AttendanceCorrection.count({
      where: { status: 'pending' }
    }).catch(() => 0),

    // 6. Recent pending leaves for approval queue
    LeaveRequest.findAll({
      where: { status: 'pending' },
      order: [['createdAt', 'DESC']],
      limit: 6,
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'firstName', 'lastName', 'employeeCode', 'department']
        },
        {
          model: LeaveType,
          as: 'leaveType',
          attributes: ['id', 'name', 'code']
        }
      ]
    }).catch(() => []),

    // 7. Recent pending corrections for approval queue
    AttendanceCorrection.findAll({
      where: { status: 'pending' },
      order: [['createdAt', 'DESC']],
      limit: 6,
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'firstName', 'lastName', 'employeeCode', 'department']
        }
      ]
    }).catch(() => []),

    // 8. Upcoming holidays (next 5)
    Holiday.findAll({
      where: { date: { [Op.gte]: todayStr } },
      order: [['date', 'ASC']],
      limit: 5
    }).catch(() => []),

    // 9. Departments list
    Department.findAll({
      where: { status: 'active' },
      attributes: ['id', 'name', 'code']
    }).catch(() => []),

    // 10. HR personal attendance status today
    attendanceService.getTodayStatus(userId).catch(() => null),

    // 11. HR personal month history
    attendanceService.getMyAttendanceHistory(userId, {
      month: today.getMonth() + 1,
      year: today.getFullYear()
    }).catch(() => null)
  ]);

  // Calculate today's status breakdown
  let presentToday = 0;
  let lateToday = 0;
  let halfDayToday = 0;

  todayAttendances.forEach((att) => {
    if (att.status === 'present') presentToday++;
    else if (att.status === 'late') {
      presentToday++;
      lateToday++;
    } else if (att.status === 'half_day') {
      presentToday++;
      halfDayToday++;
    }
  });

  const onLeaveToday = onLeaveTodayCount;
  const absentToday = Math.max(0, totalEmployees - (presentToday + onLeaveToday));
  const attendanceRateVal = totalEmployees > 0 ? ((presentToday / totalEmployees) * 100).toFixed(1) : '0.0';

  // Format department breakdown
  const departmentStats = departments.map((dept) => {
    const deptAttendances = todayAttendances.filter(
      (a) => a.user?.departmentId === dept.id || a.user?.department === dept.name
    );
    const deptPresent = deptAttendances.filter((a) => ['present', 'late', 'half_day'].includes(a.status)).length;
    return {
      id: dept.id,
      name: dept.name,
      code: dept.code,
      presentToday: deptPresent
    };
  });

  // Format leave queue items
  const formattedLeaveQueue = recentLeaves.map((l) => {
    const applicantName = l.applicant
      ? `${l.applicant.firstName} ${l.applicant.lastName || ''}`.trim()
      : 'Employee';
    return {
      id: l.id,
      employeeName: applicantName,
      employeeId: l.applicant?.employeeCode || 'EMP-N/A',
      department: l.applicant?.department || 'General',
      leaveType: l.leaveType?.name || 'Leave',
      startDate: l.startDate,
      endDate: l.endDate,
      dates: l.startDate === l.endDate ? `${l.startDate} (Full Day)` : `${l.startDate} to ${l.endDate} (${l.totalDays} Days)`,
      reason: l.reason,
      status: l.status,
      appliedAt: l.createdAt
    };
  });

  // Format correction queue items
  const formattedCorrectionQueue = recentCorrections.map((c) => {
    const applicantName = c.applicant
      ? `${c.applicant.firstName} ${c.applicant.lastName || ''}`.trim()
      : 'Employee';
    return {
      id: c.id,
      employeeName: applicantName,
      employeeId: c.applicant?.employeeCode || 'EMP-N/A',
      department: c.applicant?.department || 'General',
      date: c.date,
      type: c.punchType,
      originalTime: c.originalTime,
      requestedTime: c.requestedTime,
      reason: c.reason,
      status: c.status,
      requestedAt: c.createdAt
    };
  });

  // Format upcoming holidays
  const formattedHolidays = upcomingHolidays.map((h) => {
    const holidayDate = new Date(h.date);
    const diffMs = holidayDate - today;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return {
      id: h.id,
      title: h.title || h.name,
      date: h.date,
      type: h.type,
      daysLeft: diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`
    };
  });

  return {
    overview: {
      totalEmployees,
      presentToday,
      absentToday,
      onLeaveToday,
      lateToday,
      halfDayToday,
      attendanceRate: `${attendanceRateVal}%`,
      attendanceRateNumber: parseFloat(attendanceRateVal),
      pendingLeaveRequests: pendingLeavesCount,
      pendingCorrectionRequests: pendingCorrectionsCount
    },
    leaveQueue: formattedLeaveQueue,
    attendanceQueue: formattedCorrectionQueue,
    departmentStats,
    upcomingHolidays: formattedHolidays,
    personalAttendance: personalTodayAttendance,
    personalSummary: personalMonthHistory?.summary || null
  };
};

module.exports = { getEmployeeDashboard, getHRDashboard };
