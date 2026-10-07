const leaveService = require('../services/leave.service');
const ApiResponse = require('../utils/apiResponse');

/**
 * ==========================================
 * 1. LEAVE TYPES CONTROLLER
 * ==========================================
 */

const getAllLeaveTypes = async (req, res, next) => {
  try {
    const types = await leaveService.getAllLeaveTypes();
    return ApiResponse.success(res, {
      message: 'Leave types retrieved successfully',
      data: types
    });
  } catch (error) {
    next(error);
  }
};

const createLeaveType = async (req, res, next) => {
  try {
    const type = await leaveService.createLeaveType(req.body, req.user);
    return ApiResponse.created(res, {
      message: 'Leave type created successfully',
      data: type
    });
  } catch (error) {
    next(error);
  }
};

const updateLeaveType = async (req, res, next) => {
  try {
    const type = await leaveService.updateLeaveType(req.params.id, req.body, req.user);
    return ApiResponse.success(res, {
      message: 'Leave type updated successfully',
      data: type
    });
  } catch (error) {
    next(error);
  }
};

const deleteLeaveType = async (req, res, next) => {
  try {
    const result = await leaveService.deleteLeaveType(req.params.id, req.user);
    return ApiResponse.success(res, {
      message: 'Leave type deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * 2. LEAVE BALANCES CONTROLLER
 * ==========================================
 */

const getMyLeaveBalances = async (req, res, next) => {
  try {
    const result = await leaveService.getMyLeaveBalances(req.user.id, req.query.year);
    return ApiResponse.success(res, {
      message: 'Leave balances retrieved successfully',
      data: {
        balances: result.balances,
        summary: result.summary
      },
      meta: result.summary
    });
  } catch (error) {
    next(error);
  }
};

const getUserLeaveBalances = async (req, res, next) => {
  try {
    const result = await leaveService.getUserLeaveBalances(req.params.userId, req.query.year);
    return ApiResponse.success(res, {
      message: 'User leave balances retrieved successfully',
      data: result.balances,
      meta: result.summary
    });
  } catch (error) {
    next(error);
  }
};

const allocateBalance = async (req, res, next) => {
  try {
    const balance = await leaveService.allocateBalance(req.body, req.user);
    return ApiResponse.success(res, {
      message: 'Leave balance allocated successfully',
      data: balance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * 3. LEAVE APPLICATIONS (EMPLOYEE)
 * ==========================================
 */

const applyLeave = async (req, res, next) => {
  try {
    const request = await leaveService.applyLeave(req.user, req.body, req.ip);
    return ApiResponse.created(res, {
      message: 'Leave application submitted successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

const getMyLeaveRequests = async (req, res, next) => {
  try {
    const result = await leaveService.getMyLeaveRequests(req.user.id, req.query);
    return ApiResponse.success(res, {
      message: 'My leave applications retrieved successfully',
      data: {
        requests: result.requests,
        meta: result.meta
      },
      meta: result.meta
    });
  } catch (error) {
    next(error);
  }
};

const cancelLeave = async (req, res, next) => {
  try {
    const cancelled = await leaveService.cancelLeave(req.params.id, req.user, req.ip);
    return ApiResponse.success(res, {
      message: 'Leave request cancelled successfully',
      data: cancelled
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * 4. LEAVE MANAGEMENT (ADMIN / MANAGER)
 * ==========================================
 */

const getAdminLeaveRequests = async (req, res, next) => {
  try {
    const result = await leaveService.getAdminLeaveRequests(req.query);
    return ApiResponse.success(res, {
      message: 'Leave applications retrieved successfully',
      data: result.records,
      meta: {
        ...result.meta,
        summary: result.summary
      }
    });
  } catch (error) {
    next(error);
  }
};

const getLeaveRequestById = async (req, res, next) => {
  try {
    const request = await leaveService.getLeaveRequestById(req.params.id, req.user);
    return ApiResponse.success(res, {
      message: 'Leave application details retrieved successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

const actionLeaveRequest = async (req, res, next) => {
  try {
    const actioned = await leaveService.actionLeaveRequest(req.params.id, req.body, req.user, req.ip);
    return ApiResponse.success(res, {
      message: `Leave application ${req.body.status} successfully`,
      data: actioned
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ==========================================
 * 5. HOLIDAYS CONTROLLER
 * ==========================================
 */

const getHolidays = async (req, res, next) => {
  try {
    const holidays = await leaveService.getHolidays(req.query);
    return ApiResponse.success(res, {
      message: 'Holidays retrieved successfully',
      data: holidays
    });
  } catch (error) {
    next(error);
  }
};

const createHoliday = async (req, res, next) => {
  try {
    const holiday = await leaveService.createHoliday(req.body, req.user);
    return ApiResponse.created(res, {
      message: 'Holiday created successfully',
      data: holiday
    });
  } catch (error) {
    next(error);
  }
};

const deleteHoliday = async (req, res, next) => {
  try {
    const result = await leaveService.deleteHoliday(req.params.id, req.user);
    return ApiResponse.success(res, {
      message: 'Holiday removed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  getMyLeaveBalances,
  getUserLeaveBalances,
  allocateBalance,
  applyLeave,
  getMyLeaveRequests,
  cancelLeave,
  getAdminLeaveRequests,
  getLeaveRequestById,
  actionLeaveRequest,
  getHolidays,
  createHoliday,
  deleteHoliday
};
