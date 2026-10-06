const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/apiResponse');

/**
 * GET /api/v1/dashboard/employee - Employee dashboard summary
 */
const getEmployeeDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getEmployeeDashboard(req.user.id);
    return ApiResponse.success(res, {
      message: 'Dashboard data retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEmployeeDashboard };
