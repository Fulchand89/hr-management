const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/v1/dashboard/employee
router.get('/employee', dashboardController.getEmployeeDashboard);

module.exports = router;
