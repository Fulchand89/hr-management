const { Op } = require('sequelize');
const { User } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const { NotFoundError, ConflictError } = require('../utils/apiError');
const { sendWelcomeEmail } = require('../services/email.service');
const logger = require('../config/logger');

/**
 * Get all users with search, filtering, and pagination
 */
const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { search, role, department, status, sortBy = 'createdAt', order = 'DESC' } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    if (role) where.role = role;
    if (department) where.department = department;
    if (status) where.status = status;

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
      attributes: { exclude: ['password', 'refreshToken', 'resetPasswordToken', 'resetPasswordExpires'] }
    });

    return ApiResponse.success(res, {
      message: 'Users retrieved successfully',
      data: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'refreshToken', 'resetPasswordToken', 'resetPasswordExpires'] }
    });

    if (!user) {
      throw new NotFoundError(`User not found with ID ${req.params.id}`);
    }

    return ApiResponse.success(res, {
      message: 'User details retrieved successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user (HR / Admin action)
 */
const createUser = async (req, res, next) => {
  try {
    const existing = await User.findOne({ where: { email: req.body.email.toLowerCase() } });
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const plainPassword = req.body.password;
    const user = await User.create({
      ...req.body,
      email: req.body.email.toLowerCase()
    });

    // Notify employee of their account
    sendWelcomeEmail({
      to: user.email,
      name: `${user.firstName} ${user.lastName}`,
      temporaryPassword: plainPassword,
      role: user.role
    }).catch((err) => logger.error('Seeded user welcome email warning:', err.message));

    return ApiResponse.created(res, {
      message: 'User created successfully',
      data: user.toSafeJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user details (Admin / HR action)
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw new NotFoundError(`User not found with ID ${req.params.id}`);
    }

    const updatableFields = ['firstName', 'lastName', 'role', 'department', 'designation', 'phone', 'status'];
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    return ApiResponse.success(res, {
      message: 'User updated successfully',
      data: user.toSafeJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (Admin only)
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw new NotFoundError(`User not found with ID ${req.params.id}`);
    }

    await user.destroy();

    return ApiResponse.success(res, {
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload User Avatar
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, { statusCode: 400, message: 'Please attach an image file' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw new NotFoundError(`User not found with ID ${req.params.id}`);
    }

    user.avatar = `/uploads/${req.file.filename}`;
    await user.save();

    return ApiResponse.success(res, {
      message: 'Avatar uploaded successfully',
      data: { avatar: user.avatar }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  uploadAvatar
};
