const employeeService = require('../services/employee.service');
const ApiResponse = require('../utils/apiResponse');
const bcrypt = require('bcryptjs');
const path = require('path');
const { User } = require('../models');
const { BadRequestError } = require('../utils/apiError');

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

/**
 * 7. GET /api/v1/employees/me - Get own profile (self-service)
 */
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await employeeService.getMyProfile(req.user.id);
    return ApiResponse.success(res, {
      message: 'Profile retrieved successfully',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. PUT /api/v1/employees/me - Update own editable profile fields (self-service)
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const updated = await employeeService.updateMyProfile(req.user.id, req.body);
    return ApiResponse.success(res, {
      message: 'Profile updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 9. PUT /api/v1/employees/me/password - Change own password
 */
const changeMyPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new BadRequestError('currentPassword, newPassword and confirmPassword are required');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestError('New passwords do not match');
    }

    if (newPassword.length < 8) {
      throw new BadRequestError('New password must be at least 8 characters');
    }

    // Fetch user with password hash
    const user = await User.findByPk(req.user.id);
    const isValid = await user.validatePassword(currentPassword);

    if (!isValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    user.password = newPassword; // model hook will hash it
    await user.save();

    return ApiResponse.success(res, {
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 10. POST /api/v1/employees/me/avatar - Upload own profile photo
 */
const uploadMyAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError('Please upload an image file');
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    await User.update({ avatar: avatarUrl }, { where: { id: req.user.id } });

    return ApiResponse.success(res, {
      message: 'Avatar uploaded successfully',
      data: { avatar: avatarUrl, avatarUrl }
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
  getEmployeeStatus,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  uploadMyAvatar
};
