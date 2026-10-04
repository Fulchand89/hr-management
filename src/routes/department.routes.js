const express = require('express');
const router = express.Router();

const departmentController = require('../controllers/department.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { ROLES } = require('../constants/roles');
const {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentQuerySchema
} = require('../validators/department.validator');

// All department routes require authenticated session
router.use(authenticate);

// 1. GET /api/v1/departments - List all departments (Filter by search & status)
router.get(
  '/',
  validate(departmentQuerySchema, 'query'),
  departmentController.getAllDepartments
);

// 2. GET /api/v1/departments/:id - Get department details & member list
router.get(
  '/:id',
  departmentController.getDepartmentById
);

// 3. POST /api/v1/departments - Create new department (Admin & HR only)
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.HR),
  validate(createDepartmentSchema, 'body'),
  departmentController.createDepartment
);

// 4. PUT /api/v1/departments/:id - Update department info (Admin & HR only)
router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.HR),
  validate(updateDepartmentSchema, 'body'),
  departmentController.updateDepartment
);

// 5. DELETE /api/v1/departments/:id - Delete department (Admin only)
router.delete(
  '/:id',
  authorize(ROLES.ADMIN),
  departmentController.deleteDepartment
);

module.exports = router;
