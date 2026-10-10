const resignationService = require('../services/resignation.service');
const ApiResponse = require('../utils/apiResponse');

const submitResignation = async (req, res, next) => {
  try {
    const resignation = await resignationService.submitResignation(req.user.id, req.body);
    return ApiResponse.created(res, {
      message: 'Resignation submitted successfully',
      data: resignation
    });
  } catch (error) {
    next(error);
  }
};

const getMyResignation = async (req, res, next) => {
  try {
    const resignation = await resignationService.getMyResignation(req.user.id);
    return ApiResponse.success(res, {
      message: 'My resignation retrieved successfully',
      data: resignation
    });
  } catch (error) {
    next(error);
  }
};

const getAllResignations = async (req, res, next) => {
  try {
    const list = await resignationService.getAllResignations(req.query);
    return ApiResponse.success(res, {
      message: 'Resignations retrieved successfully',
      data: list
    });
  } catch (error) {
    next(error);
  }
};

const getResignationById = async (req, res, next) => {
  try {
    const item = await resignationService.getResignationById(req.params.id);
    return ApiResponse.success(res, {
      message: 'Resignation retrieved successfully',
      data: item
    });
  } catch (error) {
    next(error);
  }
};

const updateResignationStatus = async (req, res, next) => {
  try {
    const updated = await resignationService.updateResignationStatus(req.params.id, req.body, req.user);
    return ApiResponse.success(res, {
      message: 'Resignation status updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const updateClearanceStatus = async (req, res, next) => {
  try {
    const updated = await resignationService.updateClearanceStatus(
      req.params.id,
      req.params.clearanceId,
      req.body,
      req.user
    );
    return ApiResponse.success(res, {
      message: 'Exit clearance updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const withdrawResignation = async (req, res, next) => {
  try {
    const item = await resignationService.withdrawResignation(req.user.id, req.params.id);
    return ApiResponse.success(res, {
      message: 'Resignation withdrawn successfully',
      data: item
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitResignation,
  getMyResignation,
  getAllResignations,
  getResignationById,
  updateResignationStatus,
  updateClearanceStatus,
  withdrawResignation
};
