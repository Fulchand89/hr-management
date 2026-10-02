const Joi = require('joi');
const { ALL_ROLES } = require('../constants/roles');
const { ALL_STATUSES } = require('../constants/status');

const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(60).optional(),
  lastName: Joi.string().trim().min(2).max(60).optional(),
  phone: Joi.string().trim().max(25).allow('', null).optional(),
  designation: Joi.string().trim().max(100).allow('', null).optional()
}).min(1);

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required'
  }),
  newPassword: Joi.string().min(8).max(128).required().messages({
    'string.empty': 'New password is required',
    'string.min': 'New password must be at least 8 characters long'
  })
});

const adminCreateUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(60).required(),
  lastName: Joi.string().trim().min(2).max(60).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().trim().min(2).max(50).default('employee'),
  roleId: Joi.string().uuid().optional(),
  department: Joi.string().trim().max(100).default('General'),
  designation: Joi.string().trim().max(100).allow('', null).optional(),
  designationId: Joi.string().uuid().allow(null).optional(),
  phone: Joi.string().trim().max(25).allow('', null).optional(),
  status: Joi.string().valid(...ALL_STATUSES).default('active')
});

const adminUpdateUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(60).optional(),
  lastName: Joi.string().trim().min(2).max(60).optional(),
  role: Joi.string().trim().min(2).max(50).optional(),
  roleId: Joi.string().uuid().optional(),
  department: Joi.string().trim().max(100).optional(),
  designation: Joi.string().trim().max(100).allow('', null).optional(),
  designationId: Joi.string().uuid().allow(null).optional(),
  phone: Joi.string().trim().max(25).allow('', null).optional(),
  status: Joi.string().valid(...ALL_STATUSES).optional()
}).min(1);

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema
};
