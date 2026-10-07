const Joi = require('joi');

const createDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Department name is required',
    'string.min': 'Department name must be at least 2 characters long',
    'any.required': 'Department name is required'
  }),
  code: Joi.string().min(2).max(50).allow('', null).optional(),
  headId: Joi.string().uuid().allow(null, '').optional().messages({
    'string.guid': 'Department headId must be a valid UUID'
  }),
  description: Joi.string().max(255).allow('', null).optional(),
  status: Joi.string().valid('active', 'inactive').default('active')
});

const updateDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  code: Joi.string().min(2).max(50).allow('', null).optional(),
  headId: Joi.string().uuid().allow(null, '').optional().messages({
    'string.guid': 'Department headId must be a valid UUID'
  }),
  description: Joi.string().max(255).allow('', null).optional(),
  status: Joi.string().valid('active', 'inactive').optional()
}).min(1);

const departmentQuerySchema = Joi.object({
  search: Joi.string().allow('', null).optional(),
  status: Joi.string().valid('active', 'inactive', 'all').optional(),
  sortBy: Joi.string().valid('name', 'code', 'createdAt', 'status').default('name'),
  order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('ASC')
});

module.exports = {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentQuerySchema
};
