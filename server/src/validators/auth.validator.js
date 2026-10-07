const Joi = require('joi');

const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(60).required().messages({
    'string.empty': 'First name is required',
    'string.min': 'First name must be at least 2 characters',
    'string.max': 'First name cannot exceed 60 characters'
  }),
  lastName: Joi.string().trim().min(2).max(60).required().messages({
    'string.empty': 'Last name is required',
    'string.min': 'Last name must be at least 2 characters',
    'string.max': 'Last name cannot exceed 60 characters'
  }),
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please enter a valid email address'
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters long'
  }),
  department: Joi.string().trim().max(100).optional().default('General'),
  designation: Joi.string().trim().max(100).optional(),
  phone: Joi.string().trim().max(25).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please enter a valid email address'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  })
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'Refresh token is required'
  })
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please enter a valid email address'
  })
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Reset token is required'
  }),
  newPassword: Joi.string().min(8).max(128).required().messages({
    'string.empty': 'New password is required',
    'string.min': 'New password must be at least 8 characters long'
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
