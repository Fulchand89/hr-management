const express = require('express');
const router = express.Router();

const permissionController = require('../controllers/permission.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { ROLES } = require('../constants/roles');
const {
  createPermissionSchema,
  updatePermissionSchema
} = require('../validators/rbac.validator');

// All permission routes require authentication
router.use(authenticate);

// List all permissions (Admin and HR)
router.get('/', authorize(ROLES.ADMIN, ROLES.HR), permissionController.getAllPermissions);

// Get permission by ID (Admin and HR)
router.get('/:id', authorize(ROLES.ADMIN, ROLES.HR), permissionController.getPermissionById);

// Create permission (Admin only)
router.post(
  '/',
  authorize(ROLES.ADMIN),
  validate(createPermissionSchema),
  permissionController.createPermission
);

// Update permission (Admin only)
router.put(
  '/:id',
  authorize(ROLES.ADMIN),
  validate(updatePermissionSchema),
  permissionController.updatePermission
);

// Delete permission (Admin only)
router.delete('/:id', authorize(ROLES.ADMIN), permissionController.deletePermission);

module.exports = router;
