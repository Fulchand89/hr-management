const departmentService = require('../services/department.service');
const ApiResponse = require('../utils/apiResponse');

/**
 * 1. GET /api/v1/departments - List all departments
 */
const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await departmentService.getAllDepartments(req.query);
    return ApiResponse.success(res, {
      message: 'Departments retrieved successfully',
      data: departments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/v1/departments/:id - Get single department details
 */
const getDepartmentById = async (req, res, next) => {
  try {
    const department = await departmentService.getDepartmentById(req.params.id);
    return ApiResponse.success(res, {
      message: 'Department details retrieved successfully',
      data: department
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /api/v1/departments - Create new department
 */
const createDepartment = async (req, res, next) => {
  try {
    const department = await departmentService.createDepartment(req.body, req.user);
    return ApiResponse.created(res, {
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. PUT /api/v1/departments/:id - Update department details
 */
const updateDepartment = async (req, res, next) => {
  try {
    const updated = await departmentService.updateDepartment(req.params.id, req.body, req.user);
    return ApiResponse.success(res, {
      message: 'Department updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. DELETE /api/v1/departments/:id - Delete department
 */
const deleteDepartment = async (req, res, next) => {
  try {
    const result = await departmentService.deleteDepartment(req.params.id, req.user);
    return ApiResponse.success(res, {
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
