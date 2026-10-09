const { Op } = require('sequelize');
const { Attendance, AttendanceCorrection, Shift, User, Department, Designation, ActivityLog } = require('../models');
const { NotFoundError, BadRequestError } = require('../utils/apiError');
const logger = require('../config/logger');

/**
 * Format Date object to 12-hour AM/PM string (e.g., '09:12 AM')
 */
const formatTime12h = (dateObj) => {
  if (!dateObj) return '--:--';
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return '--:--';
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // '0' becomes '12'
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

/**
 * Format total seconds to HH:MM:SS string
 */
const formatSecondsToHMS = (totalSeconds) => {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/**
 * Safely parse timeline into an array
 */
const parseTimelineArray = (rawTimeline) => {
  if (Array.isArray(rawTimeline)) return rawTimeline;
  if (typeof rawTimeline === 'string') {
    try {
      const parsed = JSON.parse(rawTimeline);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * Compute real-time status and metrics for an attendance record
 */
const computeLiveMetrics = (attendance, shift = null) => {
  const defaultShiftHours = 9; // 9:00 AM - 6:00 PM default shift
  const totalShiftSeconds = defaultShiftHours * 3600;

  if (!attendance || !attendance.clockIn) {
    return {
      status: 'NOT_PUNCHED_IN',
      clockInTime: null,
      clockOutTime: null,
      grossSeconds: 0,
      grossWorkingHours: '00:00:00',
      workingSeconds: 0,
      breakSeconds: 0,
      totalWorkingHours: '00:00:00',
      netWorkingHours: '00:00:00',
      breakDuration: '00:00:00',
      maxBreakMinutes: shift?.breakAllowedMinutes ? Number(shift.breakAllowedMinutes) : 60,
      breakAllowanceFormatted: `${shift?.breakAllowedMinutes ? Number(shift.breakAllowedMinutes) : 60} Mins (1h)`,
      breakExceededMinutes: 0,
      breakRemainingMinutes: shift?.breakAllowedMinutes ? Number(shift.breakAllowedMinutes) : 60,
      isBreakExceeded: false,
      progress: 0,
      sinceText: 'Not clocked in yet',
      timeString: '00:00:00',
      timeline: [
        { label: 'Punch In', time: '--:--', status: 'pending' },
        { label: 'Break Started', time: '--:--', status: 'pending' },
        { label: 'Break Ended', time: '--:--', status: 'pending' },
        { label: 'Punch Out', time: '--:--', status: 'pending' }
      ]
    };
  }

  const now = new Date();
  const clockInDate = new Date(attendance.clockIn);
  const clockOutDate = attendance.clockOut ? new Date(attendance.clockOut) : null;
  const breakStartDate = attendance.breakStartTime ? new Date(attendance.breakStartTime) : null;

  // 1. Determine active state
  let currentStatus = 'WORKING';
  if (clockOutDate) {
    currentStatus = 'PUNCHED_OUT';
  } else if (breakStartDate) {
    currentStatus = 'ON_BREAK';
  }

  // 2. Break duration calculation
  let cumulativeBreakSec = (attendance.totalBreakMinutes || 0) * 60;
  if (breakStartDate && !clockOutDate) {
    const ongoingBreakSec = Math.max(0, Math.floor((now - breakStartDate) / 1000));
    cumulativeBreakSec += ongoingBreakSec;
  }

  // 3. Gross & Net Working seconds calculation
  const referenceEnd = clockOutDate || now;
  const totalElapsedSec = Math.max(0, Math.floor((referenceEnd - clockInDate) / 1000));
  const workingSec = Math.max(0, totalElapsedSec - cumulativeBreakSec);

  // 4. Progress percentage
  const progressPercent = Math.min(100, Math.round((workingSec / totalShiftSeconds) * 100));

  // 5. Since Text
  let sinceText = `Since ${formatTime12h(clockInDate)}`;
  if (currentStatus === 'ON_BREAK' && breakStartDate) {
    sinceText = `Break since ${formatTime12h(breakStartDate)}`;
  } else if (currentStatus === 'PUNCHED_OUT' && clockOutDate) {
    sinceText = `Shift ended at ${formatTime12h(clockOutDate)}`;
  }

  // 6. Timeline synthesis (Dynamic, non-hardcoded)
  const rawTimeline = parseTimelineArray(attendance.timeline);
  let timeline = rawTimeline.length > 0 ? [...rawTimeline] : [];

  if (timeline.length === 0) {
    timeline.push({
      label: 'Punch In',
      time: formatTime12h(clockInDate),
      timestamp: clockInDate.toISOString(),
      status: 'completed'
    });
    if (breakStartDate) {
      timeline.push({
        label: 'Break Started',
        time: formatTime12h(breakStartDate),
        timestamp: breakStartDate.toISOString(),
        status: 'break'
      });
    } else if (attendance.totalBreakMinutes > 0) {
      // Calculate realistic break boundaries matching the exact recorded totalBreakMinutes
      const totalBreakSec = attendance.totalBreakMinutes * 60;
      const netWorkingSec = Math.max(0, totalElapsedSec - totalBreakSec);
      const breakOffsetSec = Math.floor(netWorkingSec / 2);
      const synthStart = new Date(clockInDate.getTime() + breakOffsetSec * 1000);
      const synthEnd = new Date(synthStart.getTime() + totalBreakSec * 1000);

      timeline.push({
        label: 'Break Started',
        time: formatTime12h(synthStart),
        timestamp: synthStart.toISOString(),
        status: 'break'
      });
      timeline.push({
        label: 'Break Ended',
        time: formatTime12h(synthEnd),
        timestamp: synthEnd.toISOString(),
        status: 'completed'
      });
    }
    timeline.push({
      label: 'Punch Out',
      time: clockOutDate ? formatTime12h(clockOutDate) : '--:--',
      timestamp: clockOutDate ? clockOutDate.toISOString() : null,
      status: clockOutDate ? 'punched_out' : 'pending'
    });
  } else {
    // Ensure appropriate status indicators for break and punchout nodes
    timeline = timeline.map((item) => {
      const lbl = (item.label || '').toLowerCase();
      if (lbl.includes('break') && !lbl.includes('ended')) {
        return { ...item, status: item.status || 'break' };
      }
      if (lbl.includes('punch out')) {
        return { ...item, status: 'punched_out' };
      }
      return item;
    });
  }

  const grossWorkingHoursStr = formatSecondsToHMS(totalElapsedSec);
  const netWorkingHoursStr = formatSecondsToHMS(workingSec);
  const breakDurationStr = formatSecondsToHMS(cumulativeBreakSec);

  const maxBreakMinutes = shift?.breakAllowedMinutes ? Number(shift.breakAllowedMinutes) : 60;
  const maxBreakSec = maxBreakMinutes * 60;
  const breakExceededSec = Math.max(0, cumulativeBreakSec - maxBreakSec);
  const breakRemainingSec = Math.max(0, maxBreakSec - cumulativeBreakSec);

  return {
    status: currentStatus,
    clockInTime: attendance.clockIn,
    clockOutTime: attendance.clockOut,
    grossSeconds: totalElapsedSec,
    grossWorkingHours: grossWorkingHoursStr,
    workingSeconds: workingSec,
    breakSeconds: cumulativeBreakSec,
    totalWorkingHours: netWorkingHoursStr, // Net Effective Hours
    netWorkingHours: netWorkingHoursStr,
    breakDuration: breakDurationStr,
    maxBreakMinutes,
    breakAllowanceFormatted: `${maxBreakMinutes} Mins (1h)`,
    breakExceededMinutes: Math.floor(breakExceededSec / 60),
    breakRemainingMinutes: Math.floor(breakRemainingSec / 60),
    isBreakExceeded: cumulativeBreakSec > maxBreakSec,
    progress: progressPercent,
    sinceText,
    timeString: netWorkingHoursStr,
    timeline
  };
};

/**
 * 1. Get today's attendance status for logged-in user
 */
const getTodayStatus = async (userId) => {
  const today = new Date().toISOString().split('T')[0];

  const attendance = await Attendance.findOne({
    where: { userId, date: today },
    include: [{ model: Shift, as: 'shift', attributes: ['id', 'name', 'startTime', 'endTime', 'graceMinutes', 'breakAllowedMinutes'] }]
  });

  let shiftRecord = attendance?.shift;
  if (!shiftRecord) {
    shiftRecord = await Shift.findOne({ where: { status: 'active', name: 'General Shift' } }).catch(() => null);
  }

  const live = computeLiveMetrics(attendance, shiftRecord);

  return {
    date: today,
    attendanceId: attendance ? attendance.id : null,
    attendanceStatus: live.status,
    status: live.status, // dual property for frontend flexibility
    clockInTime: live.clockInTime,
    clockInFormatted: attendance && attendance.clockIn ? formatTime12h(attendance.clockIn) : '--:--',
    clockOutTime: live.clockOutTime,
    clockOutFormatted: attendance && attendance.clockOut ? formatTime12h(attendance.clockOut) : '--:--',
    totalHours: attendance ? attendance.totalHours : 0,
    timeString: live.timeString,
    sinceText: live.sinceText,
    progress: live.progress,
    timeline: live.timeline,
    grossSeconds: live.grossSeconds,
    grossWorkingHours: live.grossWorkingHours,
    totalWorkingHours: live.totalWorkingHours,
    netWorkingHours: live.netWorkingHours,
    breakDuration: live.breakDuration,
    workingSeconds: live.workingSeconds,
    breakSeconds: live.breakSeconds,
    maxBreakMinutes: live.maxBreakMinutes,
    breakAllowanceFormatted: live.breakAllowanceFormatted,
    breakExceededMinutes: live.breakExceededMinutes,
    breakRemainingMinutes: live.breakRemainingMinutes,
    isBreakExceeded: live.isBreakExceeded,
    shift: shiftRecord
      ? {
          id: shiftRecord.id,
          name: shiftRecord.name,
          startTime: shiftRecord.startTime,
          endTime: shiftRecord.endTime,
          graceMinutes: shiftRecord.graceMinutes || 15,
          breakAllowedMinutes: shiftRecord.breakAllowedMinutes || 60,
          display: `${shiftRecord.name} (${shiftRecord.startTime} - ${shiftRecord.endTime})`
        }
      : {
          name: 'General Shift',
          startTime: '10:00',
          endTime: '19:00',
          graceMinutes: 15,
          breakAllowedMinutes: 60,
          display: 'Shift: 10:00 AM - 07:00 PM (9h • 1h Break)'
        },
    raw: attendance || null
  };
};

/**
 * 2. Punch In
 */
const punchIn = async (user, payload = {}, ipAddress = null) => {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  // Check if attendance record already exists for today
  let attendance = await Attendance.findOne({
    where: { userId: user.id, date: today }
  });

  if (attendance && attendance.clockIn) {
    throw new BadRequestError('You have already punched in for today');
  }

  // Resolve shift
  let shift = null;
  if (payload.shiftId) {
    shift = await Shift.findByPk(payload.shiftId);
  }
  if (!shift) {
    shift = await Shift.findOne({ where: { status: 'active' } });
  }

  // Check if late (e.g., if punchIn is after 09:15)
  let status = 'present';
  if (shift && shift.startTime) {
    const [shiftHour, shiftMin] = shift.startTime.split(':').map(Number);
    const graceMin = shift.graceMinutes || 15;
    const shiftStartToday = new Date();
    shiftStartToday.setHours(shiftHour, shiftMin + graceMin, 0, 0);

    if (now > shiftStartToday) {
      status = 'late';
    }
  }

  const initialTimeline = [
    { label: 'Punch In', time: formatTime12h(now), timestamp: now.toISOString(), status: 'completed' }
  ];

  if (attendance) {
    attendance.clockIn = now;
    attendance.status = status;
    attendance.shiftId = shift ? shift.id : attendance.shiftId;
    attendance.ipAddress = ipAddress || attendance.ipAddress;
    attendance.remarks = payload.remarks || attendance.remarks;
    attendance.timeline = initialTimeline;
    await attendance.save();
  } else {
    attendance = await Attendance.create({
      userId: user.id,
      date: today,
      clockIn: now,
      status,
      shiftId: shift ? shift.id : null,
      ipAddress: ipAddress || 'INTERNAL',
      remarks: payload.remarks || null,
      timeline: initialTimeline,
      totalBreakMinutes: 0
    });
  }

  // Log activity
  await ActivityLog.create({
    userId: user.id,
    action: 'ATTENDANCE_PUNCH_IN',
    module: 'ATTENDANCE',
    targetId: attendance.id,
    ipAddress: ipAddress || 'INTERNAL',
    details: `Employee punched in at ${formatTime12h(now)} (${status.toUpperCase()})`
  }).catch((err) => logger.warn('ActivityLog warning:', err.message));

  return getTodayStatus(user.id);
};

/**
 * 3. Start Break
 */
const startBreak = async (user, payload = {}, ipAddress = null) => {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  const attendance = await Attendance.findOne({
    where: { userId: user.id, date: today }
  });

  if (!attendance || !attendance.clockIn) {
    throw new BadRequestError('You must punch in first before taking a break');
  }

  if (attendance.clockOut) {
    throw new BadRequestError('You have already punched out for today');
  }

  if (attendance.breakStartTime) {
    throw new BadRequestError('You are already on an active break');
  }

  const reason = payload.reason || 'Tea / Lunch Break';
  const updatedTimeline = parseTimelineArray(attendance.timeline);
  if (updatedTimeline.length === 0 && attendance.clockIn) {
    updatedTimeline.push({
      label: 'Punch In',
      time: formatTime12h(attendance.clockIn),
      timestamp: new Date(attendance.clockIn).toISOString(),
      status: 'completed'
    });
  }
  updatedTimeline.push({
    label: 'Break Started',
    reason,
    time: formatTime12h(now),
    timestamp: now.toISOString(),
    status: 'break'
  });

  attendance.breakStartTime = now;
  attendance.timeline = updatedTimeline;
  attendance.changed('timeline', true);
  await attendance.save();

  // Log activity
  await ActivityLog.create({
    userId: user.id,
    action: 'ATTENDANCE_BREAK_START',
    module: 'ATTENDANCE',
    targetId: attendance.id,
    ipAddress: ipAddress || 'INTERNAL',
    details: `Employee started break (${reason}) at ${formatTime12h(now)}`
  }).catch((err) => logger.warn('ActivityLog warning:', err.message));

  return getTodayStatus(user.id);
};

/**
 * 4. End Break
 */
const endBreak = async (user, ipAddress = null) => {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  const attendance = await Attendance.findOne({
    where: { userId: user.id, date: today }
  });

  if (!attendance || !attendance.breakStartTime) {
    throw new BadRequestError('You do not have an active break to resume from');
  }

  if (attendance.clockOut) {
    throw new BadRequestError('You have already punched out for today');
  }

  const breakDurationMinutes = Math.max(1, Math.round((now - new Date(attendance.breakStartTime)) / 60000));
  const newTotalBreak = (attendance.totalBreakMinutes || 0) + breakDurationMinutes;

  const updatedTimeline = parseTimelineArray(attendance.timeline);
  updatedTimeline.push({
    label: 'Break Ended',
    time: formatTime12h(now),
    timestamp: now.toISOString(),
    status: 'completed'
  });

  attendance.totalBreakMinutes = newTotalBreak;
  attendance.breakStartTime = null;
  attendance.timeline = updatedTimeline;
  attendance.changed('timeline', true);
  await attendance.save();

  // Log activity
  await ActivityLog.create({
    userId: user.id,
    action: 'ATTENDANCE_BREAK_END',
    module: 'ATTENDANCE',
    targetId: attendance.id,
    ipAddress: ipAddress || 'INTERNAL',
    details: `Employee resumed work from break at ${formatTime12h(now)} (Duration: ${breakDurationMinutes} mins)`
  }).catch((err) => logger.warn('ActivityLog warning:', err.message));

  return getTodayStatus(user.id);
};

/**
 * 5. Punch Out
 */
const punchOut = async (user, payload = {}, ipAddress = null) => {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  const attendance = await Attendance.findOne({
    where: { userId: user.id, date: today }
  });

  if (!attendance || !attendance.clockIn) {
    throw new BadRequestError('You have not punched in today');
  }

  if (attendance.clockOut) {
    throw new BadRequestError('You have already punched out for today');
  }

  const updatedTimeline = parseTimelineArray(attendance.timeline);

  // If currently on break, auto-conclude the break
  let totalBreakMinutes = attendance.totalBreakMinutes || 0;
  if (attendance.breakStartTime) {
    const ongoingBreak = Math.max(1, Math.round((now - new Date(attendance.breakStartTime)) / 60000));
    totalBreakMinutes += ongoingBreak;
    updatedTimeline.push({
      label: 'Break Ended',
      time: formatTime12h(now),
      timestamp: now.toISOString(),
      status: 'completed'
    });
    attendance.breakStartTime = null;
  }

  const clockInDate = new Date(attendance.clockIn);
  const totalWorkedSec = Math.max(0, Math.floor((now - clockInDate) / 1000) - totalBreakMinutes * 60);
  const calculatedHours = parseFloat((totalWorkedSec / 3600).toFixed(2));

  // Determine if half-day
  let finalStatus = attendance.status;
  if (calculatedHours < 4.0 && finalStatus === 'present') {
    finalStatus = 'half_day';
  }

  updatedTimeline.push({
    label: 'Punch Out',
    time: formatTime12h(now),
    timestamp: now.toISOString(),
    status: 'punched_out'
  });

  attendance.clockOut = now;
  attendance.totalHours = calculatedHours;
  attendance.totalBreakMinutes = totalBreakMinutes;
  attendance.status = finalStatus;
  attendance.remarks = payload.remarks || attendance.remarks;
  attendance.timeline = updatedTimeline;
  attendance.changed('timeline', true);
  await attendance.save();

  // Log activity
  await ActivityLog.create({
    userId: user.id,
    action: 'ATTENDANCE_PUNCH_OUT',
    module: 'ATTENDANCE',
    targetId: attendance.id,
    ipAddress: ipAddress || 'INTERNAL',
    details: `Employee punched out at ${formatTime12h(now)} (Total Hours: ${calculatedHours}h)`
  }).catch((err) => logger.warn('ActivityLog warning:', err.message));

  return getTodayStatus(user.id);
};

/**
 * 6. Get Attendance History for My Attendance View (Monthly Calendar Grid)
 */
const getMyAttendanceHistory = async (userId, query = {}) => {
  const currentDate = new Date();
  const year = parseInt(query.year, 10) || currentDate.getFullYear();
  const month = parseInt(query.month, 10) || currentDate.getMonth() + 1;

  // Compute start and end dates of the selected month
  const startDateStr = query.startDate || `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDateStr = query.endDate || `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const records = await Attendance.findAll({
    where: {
      userId,
      date: {
        [Op.between]: [startDateStr, endDateStr]
      }
    },
    include: [{ model: Shift, as: 'shift', attributes: ['name', 'startTime', 'endTime'] }],
    order: [['date', 'ASC']]
  });

  // Calculate high-level summary counters
  let presentDays = 0;
  let absentDays = 0;
  let lateDays = 0;
  let halfDays = 0;
  let totalWorkingHours = 0;
  let overtimeHours = 0;

  const formattedRecords = records.map((rec) => {
    const hours = parseFloat(rec.totalHours) || 0;
    totalWorkingHours += hours;

    if (hours > 9) {
      overtimeHours += hours - 9;
    }

    if (rec.status === 'present') presentDays++;
    else if (rec.status === 'late') {
      presentDays++;
      lateDays++;
    } else if (rec.status === 'half_day') {
      presentDays += 0.5;
      halfDays++;
    } else if (rec.status === 'absent') {
      absentDays++;
    }

    return {
      id: rec.id,
      date: rec.date,
      status: rec.status,
      clockIn: rec.clockIn,
      clockInFormatted: rec.clockIn ? formatTime12h(rec.clockIn) : '--:--',
      clockOut: rec.clockOut,
      clockOutFormatted: rec.clockOut ? formatTime12h(rec.clockOut) : '--:--',
      totalHours: rec.totalHours,
      totalBreakMinutes: rec.totalBreakMinutes || 0,
      timeline: rec.timeline || [],
      shift: rec.shift ? rec.shift.name : 'General Shift',
      remarks: rec.remarks
    };
  });

  return {
    year,
    month,
    range: { startDate: startDateStr, endDate: endDateStr },
    summary: {
      totalRecordedDays: records.length,
      presentDays: parseFloat(presentDays.toFixed(1)),
      absentDays,
      lateDays,
      halfDays,
      totalWorkingHours: parseFloat(totalWorkingHours.toFixed(2)),
      averageHoursPerDay: presentDays > 0 ? parseFloat((totalWorkingHours / presentDays).toFixed(2)) : 0,
      overtimeHours: parseFloat(overtimeHours.toFixed(2))
    },
    records: formattedRecords
  };
};

/**
 * 7. Admin: Get Daily Attendance Roster
 */
const getAdminDailyAttendance = async (query = {}) => {
  const targetDate = query.date || new Date().toISOString().split('T')[0];
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const userWhere = { role: { [Op.ne]: 'ADMIN' } }; // Filter out super admins if needed

  if (query.employeeId) {
    userWhere.id = query.employeeId;
  }
  if (query.departmentId) {
    userWhere.departmentId = query.departmentId;
  }
  if (query.search) {
    userWhere[Op.or] = [
      { firstName: { [Op.like]: `%${query.search}%` } },
      { lastName: { [Op.like]: `%${query.search}%` } },
      { email: { [Op.like]: `%${query.search}%` } },
      { employeeCode: { [Op.like]: `%${query.search}%` } }
    ];
  }

  const { rows, count } = await User.findAndCountAll({
    where: userWhere,
    attributes: ['id', 'firstName', 'lastName', 'email', 'employeeCode', 'avatar', 'department', 'designation'],
    include: [
      {
        model: Attendance,
        as: 'attendances',
        where: { date: targetDate },
        required: false, // LEFT JOIN to get all users even if no attendance
        include: [
          {
            model: Shift,
            as: 'shift',
            attributes: ['id', 'name', 'startTime', 'endTime']
          }
        ]
      }
    ],
    order: [['firstName', 'ASC']],
    limit,
    offset
  });

  const formattedRecords = rows.map((user) => {
    const attendance = user.attendances && user.attendances.length > 0 ? user.attendances[0] : null;
    let computedStatus = 'Absent';
    if (attendance) {
      if (attendance.status === 'present') computedStatus = 'Present';
      else if (attendance.status === 'late') computedStatus = 'Late';
      else if (attendance.status === 'half_day') computedStatus = 'Half Day';
      else if (attendance.status === 'absent') computedStatus = 'Absent';
      else computedStatus = 'Present'; // default fallback for ongoing
    }

    const formatHours = (decimalHours) => {
      if (!decimalHours) return '0h 0m';
      const hours = Math.floor(decimalHours);
      const minutes = Math.round((decimalHours % 1) * 60);
      return `${hours}h ${minutes}m`;
    };

    return {
      id: attendance ? attendance.id : `empty-${user.id}`,
      userId: user.id,
      employeeId: user.employeeCode || `EMP-${user.id.substring(0, 4).toUpperCase()}`,
      employeeName: `${user.firstName} ${user.lastName}`,
      department: user.department || 'N/A',
      designation: user.designation || 'N/A',
      status: computedStatus,
      punchIn: attendance && attendance.clockIn ? formatTime12h(attendance.clockIn) : '--:--',
      punchOut: attendance && attendance.clockOut ? formatTime12h(attendance.clockOut) : '--:--',
      totalHours: attendance ? formatHours(attendance.totalHours) : '0h 0m',
      raw: attendance
    };
  });

  return {
    date: targetDate,
    records: formattedRecords,
    meta: {
      totalRecords: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      limit
    }
  };
};

/**
 * 7c. Admin: Get Monthly/Custom Grid for ALL Staff
 */
const getAdminMonthlyAttendance = async (query = {}) => {
  let startDateStr, endDateStr;

  if (query.startDate && query.endDate) {
    startDateStr = query.startDate;
    endDateStr = query.endDate;
  } else {
    const currentDate = new Date();
    const year = parseInt(query.year, 10) || currentDate.getFullYear();
    const month = parseInt(query.month, 10) || currentDate.getMonth() + 1;
    startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  
  // Generate array of dates
  const datesArray = [];
  let curr = new Date(startDate);
  while (curr <= endDate) {
    datesArray.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }

  const userWhere = { role: { [Op.ne]: 'ADMIN' } };
  if (query.employeeId) userWhere.id = query.employeeId;
  if (query.departmentId) userWhere.departmentId = query.departmentId;

  const users = await User.findAll({
    where: userWhere,
    attributes: ['id', 'firstName', 'lastName', 'employeeCode', 'department'],
    order: [['firstName', 'ASC']]
  });

  const attendances = await Attendance.findAll({
    where: {
      date: { [Op.between]: [startDateStr, endDateStr] }
    },
    attributes: ['userId', 'date', 'status', 'totalHours', 'clockIn', 'clockOut']
  });

  const attendanceByUser = {};
  attendances.forEach(att => {
    if (!attendanceByUser[att.userId]) attendanceByUser[att.userId] = {};
    attendanceByUser[att.userId][att.date] = att;
  });

  const grid = users.map(user => {
    const userAtt = attendanceByUser[user.id] || {};
    let presentDays = 0;
    let lateDays = 0;
    let absentDays = 0;
    let totalWorkingHours = 0;

    const days = datesArray.map(dateStr => {
      const record = userAtt[dateStr];
      const dObj = new Date(dateStr);
      const isWeekend = dObj.getDay() === 0;
      
      let status = 'A';
      let rawStatus = 'absent';
      let hours = 0;
      let punchIn = null;
      let punchOut = null;

      if (record) {
        if (record.status === 'present') { status = 'P'; presentDays++; rawStatus = 'present'; }
        else if (record.status === 'late') { status = 'L'; lateDays++; presentDays++; rawStatus = 'late'; }
        else if (record.status === 'half_day') { status = 'H'; presentDays += 0.5; rawStatus = 'half_day'; }
        
        hours = record.totalHours || 0;
        totalWorkingHours += hours;
        
        punchIn = record.clockIn ? formatTime12h(record.clockIn) : null;
        punchOut = record.clockOut ? formatTime12h(record.clockOut) : null;
      } else {
        if (isWeekend) {
          status = 'W';
          rawStatus = 'weekend';
        } else {
          const todayStr = new Date().toISOString().split('T')[0];
          if (dateStr <= todayStr) absentDays++;
          else { status = '-'; rawStatus = 'future'; }
        }
      }

      return {
        date: dateStr,
        day: dObj.getDate(),
        status,
        rawStatus,
        hours: parseFloat(hours.toFixed(2)),
        punchIn,
        punchOut
      };
    });

    const formatHours = (decimalHours) => {
      const h = Math.floor(decimalHours);
      const m = Math.round((decimalHours % 1) * 60);
      return `${h}h ${m}m`;
    };

    return {
      userId: user.id,
      employeeId: user.employeeCode || `EMP-${user.id.substring(0,4).toUpperCase()}`,
      employeeName: `${user.firstName} ${user.lastName}`,
      department: user.department || 'N/A',
      summary: {
        present: presentDays,
        absent: absentDays,
        late: lateDays,
        totalHoursStr: formatHours(totalWorkingHours)
      },
      days
    };
  });

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    dates: datesArray.map(d => ({ dateStr: d, day: new Date(d).getDate() })),
    records: grid
  };
};

/**
 * 7d. Admin: Get Details All (Flat List for Date Range)
 */
const getAdminDetailsAll = async (query = {}) => {
  const currentDate = new Date();
  const startDateStr = query.startDate || `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-01`;
  const endDateStr = query.endDate || currentDate.toISOString().split('T')[0];

  const userWhere = { role: { [Op.ne]: 'ADMIN' } };
  if (query.employeeId) userWhere.id = query.employeeId;
  
  const { rows, count } = await User.findAndCountAll({
    where: userWhere,
    attributes: ['id', 'firstName', 'lastName', 'employeeCode', 'department'],
    include: [
      {
        model: Attendance,
        as: 'attendances',
        where: { date: { [Op.between]: [startDateStr, endDateStr] } },
        required: true, // Only fetch those who have an attendance record
      }
    ],
    order: [['firstName', 'ASC'], [{ model: Attendance, as: 'attendances' }, 'date', 'ASC']]
  });

  // Flatten the array
  const flatRecords = [];
  rows.forEach(user => {
    user.attendances.forEach(att => {
      const bMins = att.totalBreakMinutes || 0;
      const bH = Math.floor(bMins / 60);
      const bM = bMins % 60;
      const breakStr = bMins > 0 ? `${bH > 0 ? bH + 'h ' : ''}${bM}m` : '0m';

      flatRecords.push({
        id: att.id,
        employeeId: user.employeeCode || `EMP-${user.id.substring(0,4).toUpperCase()}`,
        employeeName: `${user.firstName} ${user.lastName}`,
        department: user.department || 'N/A',
        date: att.date,
        status: att.status,
        punchIn: att.clockIn ? formatTime12h(att.clockIn) : '--:--',
        punchOut: att.clockOut ? formatTime12h(att.clockOut) : '--:--',
        totalHours: att.totalHours ? `${Math.floor(att.totalHours)}h ${Math.round((att.totalHours%1)*60)}m` : '0h 0m',
        breakTaken: breakStr
      });
    });
  });

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    records: flatRecords
  };
};

/**
 * 8. Regularize Attendance (Admin or HR)
 */
const regularizeAttendance = async (attendanceId, payload, adminUser) => {
  const attendance = await Attendance.findByPk(attendanceId, {
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }]
  });

  if (!attendance) {
    throw new NotFoundError(`Attendance record with ID ${attendanceId} not found`);
  }

  if (payload.clockIn !== undefined) attendance.clockIn = payload.clockIn;
  if (payload.clockOut !== undefined) attendance.clockOut = payload.clockOut;
  if (payload.status !== undefined) attendance.status = payload.status;
  if (payload.totalHours !== undefined) attendance.totalHours = payload.totalHours;
  if (payload.remarks !== undefined) attendance.remarks = payload.remarks;

  await attendance.save();

  // Log activity
  await ActivityLog.create({
    userId: adminUser.id,
    action: 'ATTENDANCE_REGULARIZE',
    module: 'ATTENDANCE',
    targetId: attendance.id,
    ipAddress: 'INTERNAL',
    details: `Admin ${adminUser.firstName} regularized attendance for employee ${attendance.user?.firstName || ''} on ${attendance.date}`
  }).catch((err) => logger.warn('ActivityLog warning:', err.message));

  return attendance;
};

/**
 * 9. Create a new attendance correction request
 */
const createAttendanceCorrection = async (userId, payload) => {
  let attendanceId = payload.attendanceId || null;

  if (!attendanceId && payload.date) {
    const existingAttendance = await Attendance.findOne({
      where: { userId, date: payload.date }
    });
    if (existingAttendance) {
      attendanceId = existingAttendance.id;
    }
  }

  const correction = await AttendanceCorrection.create({
    userId,
    attendanceId,
    date: payload.date,
    punchType: payload.punchType,
    originalTime: payload.originalTime,
    requestedTime: payload.requestedTime,
    reason: payload.reason,
    status: 'pending'
  });

  return correction;
};

/**
 * 10. Get current user's attendance correction requests
 */
const getMyAttendanceCorrections = async (userId, query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const where = { userId };
  if (query.status && query.status !== 'all') {
    where.status = query.status;
  }
  if (query.date) {
    where.date = query.date;
  }

  const { rows, count } = await AttendanceCorrection.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    include: [
      {
        model: Attendance,
        as: 'attendance',
        attributes: ['id', 'clockIn', 'clockOut', 'status', 'totalHours']
      },
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'firstName', 'lastName']
      }
    ]
  });

  return {
    records: rows,
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  };
};

/**
 * 11. Get all attendance corrections (Admin/HR view)
 */
const getAdminAttendanceCorrections = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const where = {};
  if (query.status && query.status !== 'all') {
    where.status = query.status;
  }
  if (query.date) {
    where.date = query.date;
  }

  const userWhere = {};
  if (query.departmentId) {
    userWhere.departmentId = query.departmentId;
  }
  if (query.search) {
    userWhere[Op.or] = [
      { firstName: { [Op.like]: `%${query.search}%` } },
      { lastName: { [Op.like]: `%${query.search}%` } },
      { employeeCode: { [Op.like]: `%${query.search}%` } },
      { email: { [Op.like]: `%${query.search}%` } }
    ];
  }

  const { rows, count } = await AttendanceCorrection.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    include: [
      {
        model: User,
        as: 'applicant',
        where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
        attributes: ['id', 'firstName', 'lastName', 'employeeCode', 'department', 'designation', 'email', 'avatar']
      },
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'firstName', 'lastName']
      },
      {
        model: Attendance,
        as: 'attendance',
        attributes: ['id', 'clockIn', 'clockOut', 'status', 'totalHours']
      }
    ]
  });

  return {
    records: rows,
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  };
};

/**
 * 12. Get a single attendance correction by ID
 */
const getAttendanceCorrectionById = async (id) => {
  const correction = await AttendanceCorrection.findByPk(id, {
    include: [
      {
        model: User,
        as: 'applicant',
        attributes: ['id', 'firstName', 'lastName', 'employeeCode', 'department', 'designation', 'email', 'avatar']
      },
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'firstName', 'lastName']
      },
      {
        model: Attendance,
        as: 'attendance'
      }
    ]
  });

  if (!correction) {
    throw new NotFoundError(`Attendance correction with ID ${id} not found`);
  }

  return correction;
};

/**
 * 13. Action attendance correction (approve / reject)
 */
const actionAttendanceCorrection = async (id, payload, actionerUser) => {
  const correction = await AttendanceCorrection.findByPk(id, {
    include: [
      {
        model: User,
        as: 'applicant',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ]
  });

  if (!correction) {
    throw new NotFoundError(`Attendance correction with ID ${id} not found`);
  }

  if (correction.status !== 'pending') {
    throw new BadRequestError(`Correction request has already been ${correction.status}`);
  }

  correction.status = payload.status;
  correction.actionedBy = actionerUser.id;
  correction.actionReason = payload.actionReason || null;
  correction.actionedAt = new Date();
  await correction.save();

  // If approved, update attendance record
  if (payload.status === 'approved') {
    let attendance = null;
    if (correction.attendanceId) {
      attendance = await Attendance.findByPk(correction.attendanceId);
    } else {
      attendance = await Attendance.findOne({
        where: { userId: correction.userId, date: correction.date }
      });
    }

    if (attendance) {
      const dateStr = correction.date;
      if (correction.punchType === 'Check In Time') {
        const timeMatch = correction.requestedTime.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const meridiem = timeMatch[3]?.toUpperCase();
          if (meridiem === 'PM' && hours < 12) hours += 12;
          if (meridiem === 'AM' && hours === 12) hours = 0;
          const clockInDate = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
          if (!isNaN(clockInDate.getTime())) {
            attendance.clockIn = clockInDate;
          }
        }
      } else if (correction.punchType === 'Check Out Time') {
        const timeMatch = correction.requestedTime.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const meridiem = timeMatch[3]?.toUpperCase();
          if (meridiem === 'PM' && hours < 12) hours += 12;
          if (meridiem === 'AM' && hours === 12) hours = 0;
          const clockOutDate = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
          if (!isNaN(clockOutDate.getTime())) {
            attendance.clockOut = clockOutDate;
          }
        }
      }

      if (attendance.clockIn && attendance.clockOut) {
        const diffMs = new Date(attendance.clockOut) - new Date(attendance.clockIn);
        const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));
        attendance.totalHours = parseFloat(diffHours.toFixed(2));
      }

      attendance.remarks = (attendance.remarks ? attendance.remarks + ' | ' : '') + `Corrected per request ${correction.id}`;
      await attendance.save();
    }
  }

  // Activity log
  await ActivityLog.create({
    userId: actionerUser.id,
    action: `ATTENDANCE_CORRECTION_${payload.status.toUpperCase()}`,
    module: 'ATTENDANCE',
    targetId: correction.id,
    ipAddress: 'INTERNAL',
    details: `${actionerUser.firstName} ${payload.status} attendance correction for ${correction.applicant?.firstName || 'Employee'}`
  }).catch((err) => logger.warn('ActivityLog warning:', err.message));

  return correction;
};

module.exports = {
  getTodayStatus,
  punchIn,
  startBreak,
  endBreak,
  punchOut,
  getMyAttendanceHistory,
  getAdminDailyAttendance,
  getAdminMonthlyAttendance,
  getAdminDetailsAll,
  regularizeAttendance,
  createAttendanceCorrection,
  getMyAttendanceCorrections,
  getAdminAttendanceCorrections,
  getAttendanceCorrectionById,
  actionAttendanceCorrection
};
