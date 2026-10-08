const Joi = require('joi');
const { ALL_STATUSES, USER_STATUS } = require('../constants/status');

/**
 * Custom age validation helper ensuring minimum 18 years of age
 */
const validateMinimumAge = (value, helpers) => {
  if (!value) return value;
  const birthDate = new Date(value);
  if (isNaN(birthDate.getTime())) {
    return helpers.error('any.invalid');
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 18) {
    return helpers.error('any.invalid');
  }

  return value;
};

/**
 * Validation schema for registering a new employee
 */
const createEmployeeSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(60).required().messages({
    'string.empty': 'First name is required',
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 60 characters'
  }),
  lastName: Joi.string().trim().min(2).max(60).required().messages({
    'string.empty': 'Last name is required',
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 60 characters'
  }),
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email address is required',
    'string.email': 'Please provide a valid corporate or personal email'
  }),
  password: Joi.string().min(8).max(128).optional().default('Employee@123').messages({
    'string.min': 'Password must be at least 8 characters long'
  }),
  employeeCode: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z0-9\-_]{3,20}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Employee code must be 3-20 characters uppercase alphanumeric (e.g. EMP-001)'
    }),
  phone: Joi.string()
    .trim()
    .pattern(/^[+0-9\s-]{7,25}$/)
    .allow('', null)
    .optional()
    .messages({
      'string.pattern.base': 'Phone number must be a valid 7-25 character phone string'
    }),
  role: Joi.string().trim().min(2).max(50).optional().default('employee'),
  roleId: Joi.string().uuid().allow(null).optional(),
  department: Joi.string().trim().max(100).optional(),
  departmentId: Joi.string().uuid().allow(null).optional(),
  designation: Joi.string().trim().max(100).allow('', null).optional(),
  designationId: Joi.string().uuid().allow(null).optional(),
  branchId: Joi.string().uuid().allow(null).optional(),
  managerId: Joi.string().uuid().allow(null).optional(),
  joiningDate: Joi.date().iso().allow(null).optional().messages({
    'date.format': 'Joining date must be a valid ISO format (YYYY-MM-DD)'
  }),
  salary: Joi.number().positive().precision(2).allow(null).optional().messages({
    'number.positive': 'Salary must be a positive number'
  }),
  dob: Joi.date().iso().custom(validateMinimumAge).allow(null).optional().messages({
    'date.format': 'Date of birth must be a valid ISO format (YYYY-MM-DD)'
  }),
  gender: Joi.string().valid('male', 'female', 'other').allow(null).optional(),
  status: Joi.string().valid(...ALL_STATUSES).optional().default(USER_STATUS.ACTIVE)
});

/**
 * Validation schema for updating employee details
 */
const updateEmployeeSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(60).optional(),
  lastName: Joi.string().trim().min(2).max(60).optional(),
  email: Joi.string().trim().email().optional(),
  employeeCode: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z0-9\-_]{3,20}$/)
    .optional(),
  phone: Joi.string()
    .trim()
    .pattern(/^[+0-9\s-]{7,25}$/)
    .allow('', null)
    .optional(),
  role: Joi.string().trim().min(2).max(50).optional(),
  roleId: Joi.string().uuid().allow(null).optional(),
  department: Joi.string().trim().max(100).optional(),
  departmentId: Joi.string().uuid().allow(null).optional(),
  designation: Joi.string().trim().max(100).allow('', null).optional(),
  designationId: Joi.string().uuid().allow(null).optional(),
  branchId: Joi.string().uuid().allow(null).optional(),
  managerId: Joi.string().uuid().allow(null).optional(),
  joiningDate: Joi.date().iso().allow(null).optional(),
  salary: Joi.number().positive().precision(2).allow(null).optional(),
  dob: Joi.date().iso().custom(validateMinimumAge).allow(null).optional(),
  gender: Joi.string().valid('male', 'female', 'other').allow(null).optional(),
  status: Joi.string().valid(...ALL_STATUSES).optional()
}).min(1);

/**
 * Validation schema for employee status transition
 */
const updateEmployeeStatusSchema = Joi.object({
  status: Joi.string().valid(...ALL_STATUSES).required().messages({
    'any.required': 'Target status is required',
    'any.only': `Status must be one of: ${ALL_STATUSES.join(', ')}`
  }),
  reason: Joi.string().trim().min(5).max(500).when('status', {
    is: Joi.valid(USER_STATUS.SUSPENDED, USER_STATUS.TERMINATED, USER_STATUS.RESIGNED),
    then: Joi.required(),
    otherwise: Joi.optional().allow('', null)
  }).messages({
    'any.required': 'A reason (min 5 characters) is required when suspending, terminating, or marking employee as resigned',
    'string.min': 'Reason must be at least 5 characters long'
  }),
  effectiveDate: Joi.date().iso().optional()
});

/**
 * Validation schema for configuring / revising employee salary structure
 */
const updateSalaryStructureSchema = Joi.object({
  ctc: Joi.number().min(0).precision(2).required().messages({
    'any.required': 'Annual CTC is required',
    'number.base': 'Annual CTC must be a valid number'
  }),
  basicSalary: Joi.number().min(0).precision(2).allow(null).optional(),
  hra: Joi.number().min(0).precision(2).allow(null).optional(),
  specialAllowance: Joi.number().min(0).precision(2).allow(null).optional(),
  pfDeduction: Joi.number().min(0).precision(2).allow(null).optional(),
  esiDeduction: Joi.number().min(0).precision(2).allow(null).optional(),
  taxDeduction: Joi.number().min(0).precision(2).allow(null).optional(),
  netSalary: Joi.number().min(0).precision(2).allow(null).optional()
});

/**
 * Validation schema for employee query filters and pagination
 */
const employeeQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().allow('').optional(),
  departmentId: Joi.string().uuid().optional(),
  designationId: Joi.string().uuid().optional(),
  branchId: Joi.string().uuid().optional(),
  roleId: Joi.string().uuid().optional(),
  role: Joi.string().trim().optional(),
  status: Joi.string().valid(...ALL_STATUSES).optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  sortBy: Joi.string()
    .valid('firstName', 'lastName', 'email', 'employeeCode', 'salary', 'joiningDate', 'createdAt', 'status')
    .default('createdAt'),
  order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC')
});

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  updateEmployeeStatusSchema,
  updateSalaryStructureSchema,
  employeeQuerySchema
};
