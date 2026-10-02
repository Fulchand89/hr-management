const Joi = require('joi');

const createRoleSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Role name is required',
    'string.min': 'Role name must be at least 2 characters'
  }),
  displayName: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Display name is required'
  }),
  description: Joi.string().max(255).allow('', null),
  permissionIds: Joi.array().items(Joi.string().uuid()).default([])
});

const updateRoleSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  displayName: Joi.string().min(2).max(100),
  description: Joi.string().max(255).allow('', null),
  permissionIds: Joi.array().items(Joi.string().uuid())
});

const assignRolePermissionsSchema = Joi.object({
  permissionIds: Joi.array().items(Joi.string().uuid()).required().messages({
    'any.required': 'permissionIds array is required'
  })
});

const createPermissionSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Permission name is required'
  }),
  displayName: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Display name is required'
  }),
  module: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Module category is required'
  }),
  description: Joi.string().max(255).allow('', null)
});

const updatePermissionSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  displayName: Joi.string().min(2).max(100),
  module: Joi.string().min(2).max(50),
  description: Joi.string().max(255).allow('', null)
});

const assignUserPermissionsSchema = Joi.object({
  permissions: Joi.array()
    .items(
      Joi.alternatives().try(
        Joi.string().uuid(),
        Joi.object({
          permissionId: Joi.string().uuid().required(),
          granted: Joi.boolean().default(true)
        })
      )
    )
    .required()
    .messages({
      'any.required': 'permissions array is required'
    })
});

module.exports = {
  createRoleSchema,
  updateRoleSchema,
  assignRolePermissionsSchema,
  createPermissionSchema,
  updatePermissionSchema,
  assignUserPermissionsSchema
};
