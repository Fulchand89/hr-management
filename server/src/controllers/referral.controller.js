const referralService = require('../services/referral.service');
const ApiResponse = require('../utils/apiResponse');

const createReferral = async (req, res, next) => {
  try {
    const referral = await referralService.createReferral(req.user.id, req.body, req.file);
    return ApiResponse.created(res, {
      message: 'Referral submitted successfully',
      data: referral
    });
  } catch (error) {
    next(error);
  }
};

const getMyReferrals = async (req, res, next) => {
  try {
    const referrals = await referralService.getMyReferrals(req.user.id);
    return ApiResponse.success(res, {
      message: 'My referrals retrieved successfully',
      data: referrals
    });
  } catch (error) {
    next(error);
  }
};

const getAllReferrals = async (req, res, next) => {
  try {
    const list = await referralService.getAllReferrals(req.query);
    return ApiResponse.success(res, {
      message: 'All referrals retrieved successfully',
      data: list
    });
  } catch (error) {
    next(error);
  }
};

const getReferralById = async (req, res, next) => {
  try {
    const referral = await referralService.getReferralById(req.params.id);
    return ApiResponse.success(res, {
      message: 'Referral details retrieved successfully',
      data: referral
    });
  } catch (error) {
    next(error);
  }
};

const updateReferral = async (req, res, next) => {
  try {
    const updated = await referralService.updateReferral(req.params.id, req.body, req.user);
    return ApiResponse.success(res, {
      message: 'Referral updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReferral,
  getMyReferrals,
  getAllReferrals,
  getReferralById,
  updateReferral
};
