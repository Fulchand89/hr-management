const express = require('express');
const router = express.Router();

const roleController = require('../controllers/role.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { ROLES } = require('../constants/roles');
const {
  createRoleSchema,
  updateRoleSchema,
  assignRolePermissionsSchema
} = require('../validators/rbac.validator');

// All role routes require authentication
router.use(authenticate);

// List all roles (Admin and HR)
router.get('/', authorize(ROLES.ADMIN, ROLES.HR), roleController.getAllRoles);

// Get role by ID (Admin and HR)
router.get('/:id', authorize(ROLES.ADMIN, ROLES.HR), roleController.getRoleById);

// Get users assigned to role (Admin and HR)
router.get('/:id/users', authorize(ROLES.ADMIN, ROLES.HR), roleController.getRoleUsers);

// Create new role (Admin only)
router.post('/', authorize(ROLES.ADMIN), validate(createRoleSchema), roleController.createRole);

// Update role (Admin only)
router.put('/:id', authorize(ROLES.ADMIN), validate(updateRoleSchema), roleController.updateRole);

// Delete role (Admin only)
router.delete('/:id', authorize(ROLES.ADMIN), roleController.deleteRole);

// Assign permissions to role (Admin only)
router.put(
  '/:id/permissions',
  authorize(ROLES.ADMIN),
  validate(assignRolePermissionsSchema),
  roleController.assignPermissionsToRole
);

module.exports = router;
