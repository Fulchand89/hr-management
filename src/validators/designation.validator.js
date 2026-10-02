const Joi = require('joi');

const createDesignationSchema = Joi.object({
  title: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Designation title is required',
    'string.min': 'Designation title must be at least 2 characters long'
  }),
  code: Joi.string().min(2).max(50).allow('', null).optional(),
  department: Joi.string().max(100).allow('', null).optional(),
  description: Joi.string().max(255).allow('', null).optional(),
  status: Joi.string().valid('active', 'inactive').default('active')
});

const updateDesignationSchema = Joi.object({
  title: Joi.string().min(2).max(100).optional(),
  code: Joi.string().min(2).max(50).allow('', null).optional(),
  department: Joi.string().max(100).allow('', null).optional(),
  description: Joi.string().max(255).allow('', null).optional(),
  status: Joi.string().valid('active', 'inactive').optional()
}).min(1);

module.exports = {
  createDesignationSchema,
  updateDesignationSchema
};
