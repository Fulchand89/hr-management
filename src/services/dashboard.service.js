const attendanceService = require('./attendance.service');
const notificationService = require('./notification.service');
const { LeaveBalance, LeaveType, Holiday } = require('../models');
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

module.exports = { getEmployeeDashboard };
