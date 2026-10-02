const express = require('express');
const router = express.Router();

const designationController = require('../controllers/designation.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { ROLES } = require('../constants/roles');
const {
  createDesignationSchema,
  updateDesignationSchema
} = require('../validators/designation.validator');

// All designation routes require authentication
router.use(authenticate);

// List all designations
router.get('/', designationController.getAllDesignations);

// Get designation by ID
router.get('/:id', designationController.getDesignationById);

// Create new designation (Admin & HR)
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.HR),
  validate(createDesignationSchema),
  designationController.createDesignation
);

// Update designation (Admin & HR)
router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.HR),
  validate(updateDesignationSchema),
  designationController.updateDesignation
);

// Delete designation (Admin only)
router.delete('/:id', authorize(ROLES.ADMIN), designationController.deleteDesignation);

module.exports = router;
