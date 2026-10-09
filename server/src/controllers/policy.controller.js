const policyService = require('../services/policy.service');
const ApiResponse = require('../utils/apiResponse');

const getPolicies = async (req, res, next) => {
  try {
    const { category, status, search } = req.query;
    const result = await policyService.getPolicies({
      category,
      status,
      search,
      user: req.user
    });
    return ApiResponse.success(res, {
      message: 'Policies retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getPolicyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await policyService.getPolicyById(id, req.user);
    return ApiResponse.success(res, {
      message: 'Policy retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const createPolicy = async (req, res, next) => {
  try {
    const result = await policyService.createPolicy(req.body, req.file, req.user);
    return ApiResponse.created(res, {
      message: 'Policy created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const updatePolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await policyService.updatePolicy(id, req.body, req.file, req.user);
    return ApiResponse.success(res, {
      message: 'Policy updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const setPolicyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await policyService.setPolicyStatus(id, status, req.user);
    return ApiResponse.success(res, {
      message: `Policy status updated to ${status}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const deletePolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await policyService.deletePolicy(id, req.user);
    return ApiResponse.success(res, {
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

const acknowledgePolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reqMeta = {
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    };
    const result = await policyService.acknowledgePolicy(id, req.user, reqMeta);
    return ApiResponse.success(res, {
      message: result.message,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

const getPolicyCompliance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await policyService.getPolicyCompliance(id);
    return ApiResponse.success(res, {
      message: 'Policy compliance report generated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const sendPolicyReminders = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await policyService.sendPolicyReminders(id, req.user);
    return ApiResponse.success(res, {
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  setPolicyStatus,
  deletePolicy,
  acknowledgePolicy,
  getPolicyCompliance,
  sendPolicyReminders
};
