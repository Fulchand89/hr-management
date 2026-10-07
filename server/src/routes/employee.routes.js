const express = require('express');
const router = express.Router();

const employeeController = require('../controllers/employee.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const upload = require('../middleware/upload.middleware');
const { ROLES } = require('../constants/roles');
const { ForbiddenError } = require('../utils/apiError');
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  updateEmployeeStatusSchema,
  employeeQuerySchema
} = require('../validators/employee.validator');

/**
 * Access control helper: Allows specific roles OR the user themselves
 */
const authorizeSelfOrRoles = (...roles) => {
  return (req, res, next) => {
    if (roles.includes(req.user.role) || req.user.id === req.params.id) {
      return next();
    }
    return next(
      new ForbiddenError('You do not have permission to view or manage this employee profile')
    );
  };
};

// All employee routes require authentication
router.use(authenticate);

// =============================================
// SELF-SERVICE ROUTES (Employee own profile)
// NOTE: Must be ABOVE /:id routes to avoid conflict
// =============================================

// GET /api/v1/employees/me - Own profile
router.get('/me', employeeController.getMyProfile);

// PUT /api/v1/employees/me - Update own profile (whitelisted fields only)
router.put('/me', employeeController.updateMyProfile);

// PUT /api/v1/employees/me/password - Change own password
router.put('/me/password', employeeController.changeMyPassword);

// POST /api/v1/employees/me/avatar - Upload own avatar
router.post('/me/avatar', upload.single('avatar'), employeeController.uploadMyAvatar);

// =============================================
// ADMIN / HR ROUTES
// =============================================

// 1. POST /api/v1/employees - Register new employee (Validation ke sath)
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.HR),
  validate(createEmployeeSchema, 'body'),
  employeeController.createEmployee
);

// 2. GET /api/v1/employees - List all employees (Pagination + Search + Filter)
router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.HR, ROLES.MANAGER),
  validate(employeeQuerySchema, 'query'),
  employeeController.getAllEmployees
);

// 6. GET /api/v1/employees/:id/status - Current employment + Real-time punch/leave status check
// (Put before /:id route so it doesn't conflict)
router.get(
  '/:id/status',
  authorizeSelfOrRoles(ROLES.ADMIN, ROLES.HR, ROLES.MANAGER),
  employeeController.getEmployeeStatus
);

// 5. PATCH /api/v1/employees/:id/status - Status change (Active, Probation, Suspended, Terminated - Reason ke sath)
router.patch(
  '/:id/status',
  authorize(ROLES.ADMIN, ROLES.HR),
  validate(updateEmployeeStatusSchema, 'body'),
  employeeController.changeEmployeeStatus
);

// 3. GET /api/v1/employees/:id - Complete 360° profile view
router.get(
  '/:id',
  authorizeSelfOrRoles(ROLES.ADMIN, ROLES.HR, ROLES.MANAGER),
  employeeController.getEmployeeById
);

// 4. PUT /api/v1/employees/:id - Employee details update
router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.HR),
  validate(updateEmployeeSchema, 'body'),
  employeeController.updateEmployee
);

module.exports = router;
