const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

// GET /api/v1/dashboard/employee
router.get('/employee', dashboardController.getEmployeeDashboard);

// GET /api/v1/dashboard/hr
router.get('/hr', authorize(ROLES.HR, ROLES.ADMIN, ROLES.MANAGER), dashboardController.getHRDashboard);

module.exports = router;
