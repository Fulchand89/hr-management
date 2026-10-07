const express = require('express');
const router = express.Router();

const reportsController = require('../controllers/reports.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

// All reports routes require authentication and HR / Admin / Manager permissions
router.use(authenticate);
router.use(authorize(ROLES.ADMIN, ROLES.HR, ROLES.MANAGER));

// 1. Detailed attendance reports (daily, monthly, late, etc.)
router.get('/attendance', reportsController.getAttendanceReport);

// 2. Comprehensive leave report
router.get('/leave', reportsController.getLeaveReport);

// 3. Employee 360 monthly audit summary
router.get('/employee-summary', reportsController.getEmployeeSummaryReport);

module.exports = router;
