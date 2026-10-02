const employeeService = require('../services/employee.service');
const ApiResponse = require('../utils/apiResponse');

/**
 * 1. POST /api/v1/employees - Register new employee
 */
const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body, req.user);
    return ApiResponse.created(res, {
      message: 'Employee registered successfully',
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/v1/employees - List all employees (Pagination + Search + Filter)
 */
const getAllEmployees = async (req, res, next) => {
  try {
    const result = await employeeService.getAllEmployees(req.query);
    return ApiResponse.success(res, {
      message: 'Employees retrieved successfully',
      data: result.rows,
      meta: result.meta
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET /api/v1/employees/:id - Complete 360° profile view
 */
const getEmployeeById = async (req, res, next) => {
  try {
    const profile = await employeeService.getEmployee360Profile(req.params.id);
    return ApiResponse.success(res, {
      message: 'Employee 360 profile retrieved successfully',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. PUT /api/v1/employees/:id - Employee details update
 */
const updateEmployee = async (req, res, next) => {
  try {
    const updated = await employeeService.updateEmployee(req.params.id, req.body, req.user);
    return ApiResponse.success(res, {
      message: 'Employee updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. PATCH /api/v1/employees/:id/status - Status change (Active, Probation, Suspended, Terminated - Reason ke sath)
 */
const changeEmployeeStatus = async (req, res, next) => {
  try {
    const result = await employeeService.changeEmployeeStatus(req.params.id, req.body, req.user);
    return ApiResponse.success(res, {
      message: `Employee status successfully changed to '${result.currentStatus}'`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. GET /api/v1/employees/:id/status - Current employment + Real-time punch/leave status check
 */
const getEmployeeStatus = async (req, res, next) => {
  try {
    const statusData = await employeeService.getEmployeeRealTimeStatus(req.params.id);
    return ApiResponse.success(res, {
      message: 'Employee real-time status retrieved successfully',
      data: statusData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  changeEmployeeStatus,
  getEmployeeStatus
};
