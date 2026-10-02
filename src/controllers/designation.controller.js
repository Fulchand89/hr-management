const designationService = require('../services/designation.service');
const ApiResponse = require('../utils/apiResponse');

const getAllDesignations = async (req, res, next) => {
  try {
    const designations = await designationService.getAllDesignations(req.query);
    return ApiResponse.success(res, {
      message: 'Designations retrieved successfully',
      data: designations
    });
  } catch (error) {
    next(error);
  }
};

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
  getDesignationById,
  createDesignation,
  updateDesignation,
  deleteDesignation
};
