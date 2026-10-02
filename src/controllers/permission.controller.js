const rbacService = require('../services/rbac.service');
const ApiResponse = require('../utils/apiResponse');

const getAllPermissions = async (req, res, next) => {
  try {
    const groupByModule = req.query.groupByModule === 'true';
    const permissions = await rbacService.getAllPermissions(groupByModule);
    return ApiResponse.success(res, {
      message: 'Permissions retrieved successfully',
      data: permissions
    });
  } catch (error) {
    next(error);
  }
};

const getPermissionById = async (req, res, next) => {
  try {
    const permission = await rbacService.getPermissionById(req.params.id);
    return ApiResponse.success(res, {
      message: 'Permission details retrieved successfully',
      data: permission
    });
  } catch (error) {
    next(error);
  }
};

const createPermission = async (req, res, next) => {
  try {
    const permission = await rbacService.createPermission(req.body);
    return ApiResponse.created(res, {
      message: 'Permission created successfully',
      data: permission
    });
  } catch (error) {
    next(error);
  }
};

const updatePermission = async (req, res, next) => {
  try {
    const permission = await rbacService.updatePermission(req.params.id, req.body);
    return ApiResponse.success(res, {
      message: 'Permission updated successfully',
      data: permission
    });
  } catch (error) {
    next(error);
  }
};

const deletePermission = async (req, res, next) => {
  try {
    const result = await rbacService.deletePermission(req.params.id);
    return ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission
};
