const Joi = require('joi');

const salaryValidator = (value, helpers) => {
  if (
    value.minSalary !== undefined &&
    value.minSalary !== null &&
    value.maxSalary !== undefined &&
    value.maxSalary !== null
  ) {
    if (Number(value.minSalary) > Number(value.maxSalary)) {
      return helpers.message('Minimum salary cannot be greater than maximum salary');
    }
  }
  return value;
};

const createDesignationSchema = Joi.object({
  title: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Designation title is required',
    'string.min': 'Designation title must be at least 2 characters long',
    'string.max': 'Designation title cannot exceed 100 characters',
    'any.required': 'Designation title is required'
  }),
  code: Joi.string().trim().min(2).max(50).allow('', null).optional().messages({
    'string.min': 'Designation code must be at least 2 characters long',
    'string.max': 'Designation code cannot exceed 50 characters'
  }),
  departmentId: Joi.string().uuid().allow('', null).optional().messages({
    'string.guid': 'departmentId must be a valid UUID'
  }),
  department: Joi.string().trim().max(100).allow('', null).optional(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  minSalary: Joi.number().min(0).allow(null).optional().messages({
    'number.min': 'Minimum salary cannot be negative'
  }),
  maxSalary: Joi.number().min(0).allow(null).optional().messages({
    'number.min': 'Maximum salary cannot be negative'
  }),
  level: Joi.string()
    .valid(
      'entry',
      'junior',
      'mid',
      'senior',
      'lead',
      'manager',
      'executive',
      'director'
    )
    .default('mid'),
  status: Joi.string().valid('active', 'inactive').default('active')
}).custom(salaryValidator, 'Salary range check');

const updateDesignationSchema = Joi.object({
  title: Joi.string().trim().min(2).max(100).optional().messages({
    'string.empty': 'Designation title cannot be empty',
    'string.min': 'Designation title must be at least 2 characters long',
    'string.max': 'Designation title cannot exceed 100 characters'
  }),
  code: Joi.string().trim().min(2).max(50).allow('', null).optional(),
  departmentId: Joi.string().uuid().allow('', null).optional().messages({
    'string.guid': 'departmentId must be a valid UUID'
  }),
  department: Joi.string().trim().max(100).allow('', null).optional(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  minSalary: Joi.number().min(0).allow(null).optional(),
  maxSalary: Joi.number().min(0).allow(null).optional(),
  level: Joi.string()
    .valid(
      'entry',
      'junior',
      'mid',
      'senior',
      'lead',
      'manager',
      'executive',
      'director'
    )
    .optional(),
  status: Joi.string().valid('active', 'inactive').optional()
})
  .min(1)
  .custom(salaryValidator, 'Salary range check');

const updateDesignationStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive').required().messages({
    'any.required': 'Status is required',
    'any.only': 'Status must be either active or inactive'
  })
});

const designationQuerySchema = Joi.object({
  search: Joi.string().trim().allow('', null).optional(),
  departmentId: Joi.string().uuid().allow('', null).optional(),
  department: Joi.string().trim().allow('', null).optional(),
  level: Joi.string()
    .valid(
      'entry',
      'junior',
      'mid',
      'senior',
      'lead',
      'manager',
      'executive',
      'director',
      '',
      null
    )
    .optional(),
  status: Joi.string().valid('active', 'inactive', 'all', '', null).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string()
    .valid('title', 'code', 'department', 'level', 'status', 'minSalary', 'maxSalary', 'createdAt')
    .default('title'),
  order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('ASC'),
  paginate: Joi.boolean().truthy('true', '1').falsy('false', '0').optional()
});

module.exports = {
  createDesignationSchema,
  updateDesignationSchema,
  updateDesignationStatusSchema,
  designationQuerySchema
};
