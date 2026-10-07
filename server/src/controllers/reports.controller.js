const reportsService = require('../services/reports.service');
const ApiResponse = require('../utils/apiResponse');

/**
 * GET /api/v1/reports/attendance - Detailed attendance report
 */
const getAttendanceReport = async (req, res, next) => {
  try {
    const result = await reportsService.getAttendanceReport(req.query);

    if (result.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.status(200).send(result.data);
    }

    return ApiResponse.success(res, {
      message: 'Attendance report generated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/reports/leave - Leave applications and consumption report
 */
const getLeaveReport = async (req, res, next) => {
  try {
    const result = await reportsService.getLeaveReport(req.query);

    if (result.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.status(200).send(result.data);
    }

    return ApiResponse.success(res, {
      message: 'Leave report generated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/reports/employee-summary - Comprehensive monthly dossier for single employee
 */
const getEmployeeSummaryReport = async (req, res, next) => {
  try {
    const result = await reportsService.getEmployeeSummaryReport(req.query);

    if (result.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.status(200).send(result.data);
    }

    return ApiResponse.success(res, {
      message: 'Employee summary report generated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendanceReport,
  getLeaveReport,
  getEmployeeSummaryReport
};
