const attendanceService = require('../services/attendance.service');
const ApiResponse = require('../utils/apiResponse');

/**
 * 1. GET /api/v1/attendance/today - Get current live stopwatch & punch status
 */
const getTodayStatus = async (req, res, next) => {
  try {
    const status = await attendanceService.getTodayStatus(req.user.id);
    return ApiResponse.success(res, {
      message: 'Today attendance status retrieved successfully',
      data: status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. POST /api/v1/attendance/punch-in - Clock in for today
 */
const punchIn = async (req, res, next) => {
  try {
    const status = await attendanceService.punchIn(req.user, req.body, req.ip);
    return ApiResponse.created(res, {
      message: 'Punched in successfully',
      data: status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /api/v1/attendance/break-start - Start break
 */
const startBreak = async (req, res, next) => {
  try {
    const status = await attendanceService.startBreak(req.user, req.body, req.ip);
    return ApiResponse.success(res, {
      message: 'Break started successfully',
      data: status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. POST /api/v1/attendance/break-end - End break
 */
const endBreak = async (req, res, next) => {
  try {
    const status = await attendanceService.endBreak(req.user, req.ip);
    return ApiResponse.success(res, {
      message: 'Break ended successfully. Welcome back!',
      data: status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. POST /api/v1/attendance/punch-out - Clock out for today
 */
const punchOut = async (req, res, next) => {
  try {
    const status = await attendanceService.punchOut(req.user, req.body, req.ip);
    return ApiResponse.success(res, {
      message: 'Punched out successfully. Have a great day!',
      data: status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. GET /api/v1/attendance/my-history - Monthly attendance records & summary
 */
const getMyHistory = async (req, res, next) => {
  try {
    const history = await attendanceService.getMyAttendanceHistory(req.user.id, req.query);
    return ApiResponse.success(res, {
      message: 'My attendance history retrieved successfully',
      data: history
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. GET /api/v1/attendance/admin/daily - Admin view of today's attendance roster
 */
const getAdminDaily = async (req, res, next) => {
  try {
    const result = await attendanceService.getAdminDailyAttendance(req.query);
    return ApiResponse.success(res, {
      message: 'Daily attendance roster retrieved successfully',
      data: result.records,
      meta: result.meta
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7b. GET /api/v1/attendance/admin/staff/:id/history - Admin view of a specific staff's monthly attendance
 */
const getAdminStaffHistory = async (req, res, next) => {
  try {
    const history = await attendanceService.getMyAttendanceHistory(req.params.id, req.query);
    return ApiResponse.success(res, {
      message: 'Staff attendance history retrieved successfully',
      data: history
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7c. GET /api/v1/attendance/admin/monthly - Admin view of monthly grid for all staff
 */
const getAdminMonthlyGrid = async (req, res, next) => {
  try {
    const grid = await attendanceService.getAdminMonthlyAttendance(req.query);
    return ApiResponse.success(res, {
      message: 'Monthly staff attendance grid retrieved successfully',
      data: grid
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7d. GET /api/v1/attendance/admin/details-all - Admin view of flat list for all staff in a date range
 */
const getAdminDetailsAllGrid = async (req, res, next) => {
  try {
    const data = await attendanceService.getAdminDetailsAll(req.query);
    return ApiResponse.success(res, {
      message: 'Detailed staff attendance retrieved successfully',
      data: data.records,
      meta: {
        startDate: data.startDate,
        endDate: data.endDate,
        totalRecords: data.records ? data.records.length : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. PUT /api/v1/attendance/admin/regularize/:id - Regularize attendance record
 */
const regularize = async (req, res, next) => {
  try {
    const record = await attendanceService.regularizeAttendance(req.params.id, req.body, req.user);
    return ApiResponse.success(res, {
      message: 'Attendance record regularized successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 9. POST /api/v1/attendance/corrections - Submit attendance correction request
 */
const createCorrection = async (req, res, next) => {
  try {
    const record = await attendanceService.createAttendanceCorrection(req.user.id, req.body);
    return ApiResponse.created(res, {
      message: 'Attendance correction request submitted successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 10. GET /api/v1/attendance/corrections/mine - Get current user's corrections
 */
const getMyCorrections = async (req, res, next) => {
  try {
    const result = await attendanceService.getMyAttendanceCorrections(req.user.id, req.query);
    return ApiResponse.success(res, {
      message: 'My attendance corrections retrieved successfully',
      data: result.records,
      meta: result.meta
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 11. GET /api/v1/attendance/admin/corrections - Admin view of all corrections
 */
const getAdminCorrections = async (req, res, next) => {
  try {
    const result = await attendanceService.getAdminAttendanceCorrections(req.query);
    return ApiResponse.success(res, {
      message: 'Attendance corrections retrieved successfully',
      data: result.records,
      meta: result.meta
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 12. GET /api/v1/attendance/admin/corrections/:id - Single correction details
 */
const getCorrectionById = async (req, res, next) => {
  try {
    const record = await attendanceService.getAttendanceCorrectionById(req.params.id);
    return ApiResponse.success(res, {
      message: 'Attendance correction details retrieved successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 13. PATCH /api/v1/attendance/admin/corrections/:id/action - Approve/Reject correction
 */
const actionCorrection = async (req, res, next) => {
  try {
    const record = await attendanceService.actionAttendanceCorrection(req.params.id, req.body, req.user);
    return ApiResponse.success(res, {
      message: `Attendance correction ${req.body.status} successfully`,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTodayStatus,
  punchIn,
  startBreak,
  endBreak,
  punchOut,
  getMyHistory,
  getAdminDaily,
  getAdminStaffHistory,
  getAdminMonthlyGrid,
  getAdminDetailsAllGrid,
  regularize,
  createCorrection,
  getMyCorrections,
  getAdminCorrections,
  getCorrectionById,
  actionCorrection
};
