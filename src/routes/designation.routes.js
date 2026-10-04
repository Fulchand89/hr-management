const express = require('express');
const router = express.Router();

const designationController = require('../controllers/designation.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { ROLES } = require('../constants/roles');
const {
  createDesignationSchema,
  updateDesignationSchema,
  updateDesignationStatusSchema,
  designationQuerySchema
} = require('../validators/designation.validator');

// All designation routes require authenticated session
router.use(authenticate);

// 1. GET /api/v1/designations - List all designations (Filtering, Search, Sorting, Optional Pagination)
router.get(
  '/',
  validate(designationQuerySchema, 'query'),
  designationController.getAllDesignations
);

// 2. GET /api/v1/designations/stats - High-level metrics and distribution breakdown (Admin & HR)
router.get(
  '/stats',
  authorize(ROLES.ADMIN, ROLES.HR),
  designationController.getDesignationStats
);

// 3. GET /api/v1/designations/:id/employees - Dedicated list of employees holding this designation
router.get(
  '/:id/employees',
  authorize(ROLES.ADMIN, ROLES.HR, ROLES.MANAGER),
  designationController.getDesignationEmployees
);

// 4. GET /api/v1/designations/:id - Single designation details with department & employees list
router.get('/:id', designationController.getDesignationById);

// 5. POST /api/v1/designations - Create new designation (Admin & HR)
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.HR),
  validate(createDesignationSchema, 'body'),
  designationController.createDesignation
);

// 6. PUT /api/v1/designations/:id - Update designation details (Admin & HR)
router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.HR),
  validate(updateDesignationSchema, 'body'),
  designationController.updateDesignation
);

// 7. PATCH /api/v1/designations/:id/status - Quick status toggle active/inactive (Admin & HR)
router.patch(
  '/:id/status',
  authorize(ROLES.ADMIN, ROLES.HR),
  validate(updateDesignationStatusSchema, 'body'),
  designationController.updateDesignationStatus
);

// 8. DELETE /api/v1/designations/:id - Safe deletion (Admin only)
router.delete('/:id', authorize(ROLES.ADMIN), designationController.deleteDesignation);

module.exports = router;
