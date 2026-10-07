const designationService = require('../services/designation.service');
const ApiResponse = require('../utils/apiResponse');

/**
 * Controller: List all designations with filters and optional pagination
 */
const getAllDesignations = async (req, res, next) => {
  try {
    const result = await designationService.getAllDesignations(req.query);
    if (result.pagination) {
      return ApiResponse.success(res, {
        message: 'Designations retrieved successfully',
        data: result.designations,
        meta: result.pagination
      });
    }
    return ApiResponse.success(res, {
      message: 'Designations retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Metrics & statistical breakdown
 */
const getDesignationStats = async (req, res, next) => {
  try {
    const stats = await designationService.getDesignationStats();
    return ApiResponse.success(res, {
      message: 'Designation statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Single designation details
 */
const getDesignationById = async (req, res, next) => {
  try {
    const designation = await designationService.getDesignationById(req.params.id);
    return ApiResponse.success(res, {
      message: 'Designation details retrieved successfully',
      data: designation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Dedicated list of employees holding this designation
 */
const getDesignationEmployees = async (req, res, next) => {
  try {
    const result = await designationService.getDesignationEmployees(req.params.id, req.query);
    return ApiResponse.success(res, {
      message: 'Employees retrieved successfully for designation',
      data: result.employees,
      meta: {
        designation: result.designation,
        ...result.pagination
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Create new designation
 */
const createDesignation = async (req, res, next) => {
  try {
    const designation = await designationService.createDesignation(req.body);
    return ApiResponse.created(res, {
      message: 'Designation created successfully',
      data: designation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Update designation information
 */
const updateDesignation = async (req, res, next) => {
  try {
    const designation = await designationService.updateDesignation(req.params.id, req.body);
    return ApiResponse.success(res, {
      message: 'Designation updated successfully',
      data: designation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Quick status toggle (active <-> inactive)
 */
const updateDesignationStatus = async (req, res, next) => {
  try {
    const result = await designationService.updateDesignationStatus(req.params.id, req.body.status);
    return ApiResponse.success(res, {
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Delete designation (safe delete)
 */
const deleteDesignation = async (req, res, next) => {
  try {
    const result = await designationService.deleteDesignation(req.params.id);
    return ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDesignations,
  getDesignationStats,
  getDesignationById,
  getDesignationEmployees,
  createDesignation,
  updateDesignation,
  updateDesignationStatus,
  deleteDesignation
};
