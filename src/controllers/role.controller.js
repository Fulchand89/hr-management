const rbacService = require('../services/rbac.service');
const ApiResponse = require('../utils/apiResponse');

const getAllRoles = async (req, res, next) => {
  try {
    const roles = await rbacService.getAllRoles();
    return ApiResponse.success(res, {
      message: 'Roles retrieved successfully',
      data: roles
    });
  } catch (error) {
    next(error);
  }
};

const getRoleById = async (req, res, next) => {
  try {
    const role = await rbacService.getRoleById(req.params.id);
    return ApiResponse.success(res, {
      message: 'Role details retrieved successfully',
      data: role
    });
  } catch (error) {
    next(error);
  }
};

const createRole = async (req, res, next) => {
  try {
    const role = await rbacService.createRole(req.body);
    return ApiResponse.created(res, {
      message: 'Role created successfully',
      data: role
    });
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const role = await rbacService.updateRole(req.params.id, req.body);
    return ApiResponse.success(res, {
      message: 'Role updated successfully',
      data: role
    });
  } catch (error) {
    next(error);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    const result = await rbacService.deleteRole(req.params.id);
    return ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

const assignPermissionsToRole = async (req, res, next) => {
  try {
    const role = await rbacService.assignPermissionsToRole(req.params.id, req.body.permissionIds);
    return ApiResponse.success(res, {
      message: 'Role permissions updated successfully',
      data: role
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionsToRole
};
