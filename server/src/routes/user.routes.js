const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const upload = require('../middleware/upload.middleware');
const { ROLES } = require('../constants/roles');
const { adminCreateUserSchema, adminUpdateUserSchema } = require('../validators/user.validator');
const { assignUserPermissionsSchema } = require('../validators/rbac.validator');

// All user management routes require valid authentication
router.use(authenticate);

// List all users - HR and Admin only
router.get('/', authorize(ROLES.ADMIN, ROLES.HR), userController.getAllUsers);

// Get specific user by ID
router.get('/:id', userController.getUserById);

// Create new user - HR and Admin only
router.post('/', authorize(ROLES.ADMIN, ROLES.HR), validate(adminCreateUserSchema), userController.createUser);

// Update user - HR and Admin only
router.put('/:id', authorize(ROLES.ADMIN, ROLES.HR), validate(adminUpdateUserSchema), userController.updateUser);

// Delete user - Admin only
router.delete('/:id', authorize(ROLES.ADMIN), userController.deleteUser);

// Upload profile avatar
router.post('/:id/avatar', upload.single('avatar'), userController.uploadAvatar);

// ==========================================
// USER PERMISSIONS ROUTES
// ==========================================

// Get user permissions (Admin, HR, or self)
router.get('/:id/permissions', authorize(ROLES.ADMIN, ROLES.HR), userController.getUserPermissions);

// Assign direct permissions to user (Admin only)
router.post(
  '/:id/permissions',
  authorize(ROLES.ADMIN),
  validate(assignUserPermissionsSchema),
  userController.assignUserPermissions
);

// Remove a direct permission from user (Admin only)
router.delete(
  '/:id/permissions/:permissionId',
  authorize(ROLES.ADMIN),
  userController.removeUserPermission
);

module.exports = router;
