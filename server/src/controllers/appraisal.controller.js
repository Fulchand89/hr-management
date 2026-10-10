const appraisalService = require('../services/appraisal.service');
const ApiResponse = require('../utils/apiResponse');

const createAppraisalReview = async (req, res, next) => {
  try {
    const review = await appraisalService.createAppraisalReview(req.body, req.user);
    return ApiResponse.created(res, {
      message: 'Appraisal review recorded successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

const getMyAppraisals = async (req, res, next) => {
  try {
    const list = await appraisalService.getEmployeeAppraisals(req.user.id);
    return ApiResponse.success(res, {
      message: 'My appraisal history retrieved successfully',
      data: list
    });
  } catch (error) {
    next(error);
  }
};

const getAllAppraisals = async (req, res, next) => {
  try {
    const list = await appraisalService.getAllAppraisals(req.query);
    return ApiResponse.success(res, {
      message: 'All appraisals retrieved successfully',
      data: list
    });
  } catch (error) {
    next(error);
  }
};

const getAppraisalById = async (req, res, next) => {
  try {
    const review = await appraisalService.getAppraisalById(req.params.id);
    return ApiResponse.success(res, {
      message: 'Appraisal details retrieved successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

const getEmployeeAppraisals = async (req, res, next) => {
  try {
    const list = await appraisalService.getEmployeeAppraisals(req.params.userId);
    return ApiResponse.success(res, {
      message: 'Employee appraisal history retrieved successfully',
      data: list
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppraisalReview,
  getMyAppraisals,
  getAllAppraisals,
  getAppraisalById,
  getEmployeeAppraisals
};
