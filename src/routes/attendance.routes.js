const express = require('express');
const router = express.Router();

const attendanceController = require('../controllers/attendance.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { ROLES } = require('../constants/roles');
const {
  punchInSchema,
  breakStartSchema,
  punchOutSchema,
  attendanceHistoryQuerySchema,
  adminAttendanceQuerySchema,
  regularizeAttendanceSchema,
  createCorrectionSchema,
  queryCorrectionSchema,
  actionCorrectionSchema
} = require('../validators/attendance.validator');

// All attendance routes require authenticated user session
router.use(authenticate);

// ==========================================
// 1. Employee Self-Service Attendance Routes
// ==========================================

// Get today's live stopwatch & punch status
router.get('/today', attendanceController.getTodayStatus);

// Clock in for today
router.post('/punch-in', validate(punchInSchema, 'body'), attendanceController.punchIn);

// Start break
router.post('/break-start', validate(breakStartSchema, 'body'), attendanceController.startBreak);

// End break
router.post('/break-end', attendanceController.endBreak);

// Clock out for today
router.post('/punch-out', validate(punchOutSchema, 'body'), attendanceController.punchOut);

// Monthly attendance calendar history
router.get(
  '/my-history',
  validate(attendanceHistoryQuerySchema, 'query'),
  attendanceController.getMyHistory
);

// Attendance corrections self-service
router.post(
  '/corrections',
  validate(createCorrectionSchema, 'body'),
  attendanceController.createCorrection
);

router.get('/corrections/mine', attendanceController.getMyCorrections);

// ==========================================
// 2. Admin & HR Management Attendance Routes
// ==========================================

// Get daily attendance roster for all employees
router.get(
  '/admin/daily',
  authorize(ROLES.ADMIN, ROLES.HR, ROLES.MANAGER),
  validate(adminAttendanceQuerySchema, 'query'),
  attendanceController.getAdminDaily
);

// Regularize attendance record for an employee
router.put(
  '/admin/regularize/:id',
  authorize(ROLES.ADMIN, ROLES.HR),
  validate(regularizeAttendanceSchema, 'body'),
  attendanceController.regularize
);

// Attendance corrections management for Admin / HR
router.get(
  '/admin/corrections',
  authorize(ROLES.ADMIN, ROLES.HR, ROLES.MANAGER),
  validate(queryCorrectionSchema, 'query'),
  attendanceController.getAdminCorrections
);

router.get(
  '/admin/corrections/:id',
  authorize(ROLES.ADMIN, ROLES.HR, ROLES.MANAGER),
  attendanceController.getCorrectionById
);

router.patch(
  '/admin/corrections/:id/action',
  authorize(ROLES.ADMIN, ROLES.HR, ROLES.MANAGER),
  validate(actionCorrectionSchema, 'body'),
  attendanceController.actionCorrection
);

module.exports = router;
