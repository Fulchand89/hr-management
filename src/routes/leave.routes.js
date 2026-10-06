const express = require('express');
const router = express.Router();

const leaveController = require('../controllers/leave.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { ROLES } = require('../constants/roles');
const {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  applyLeaveSchema,
  actionLeaveSchema,
  allocateBalanceSchema,
  leaveHistoryQuerySchema,
  adminLeaveQuerySchema,
  createHolidaySchema,
  holidayQuerySchema
} = require('../validators/leave.validator');

// All leave management routes require authenticated session
router.use(authenticate);

// ==========================================
// 1. LEAVE TYPES ROUTES
// ==========================================

// List all leave types
router.get('/types', leaveController.getAllLeaveTypes);

// Create new leave type (Admin & HR)
router.post(
  '/types',
  authorize(ROLES.ADMIN, ROLES.HR),
  validate(createLeaveTypeSchema, 'body'),
  leaveController.createLeaveType
);

// Update leave type (Admin & HR)
router.put(
  '/types/:id',
  authorize(ROLES.ADMIN, ROLES.HR),
  validate(updateLeaveTypeSchema, 'body'),
  leaveController.updateLeaveType
);

// Delete leave type (Admin only)
router.delete(
  '/types/:id',
  authorize(ROLES.ADMIN),
  leaveController.deleteLeaveType
);

// ==========================================
// 2. LEAVE BALANCES ROUTES
// ==========================================

// Current user's leave quotas & balance summary
router.get('/my-balances', leaveController.getMyLeaveBalances);

// Get specific user's leave balances (Admin, HR, Manager, or Self)
router.get('/balances/:userId', leaveController.getUserLeaveBalances);

// Allocate or adjust leave quota (Admin & HR)
router.post(
  '/balances/allocate',
  authorize(ROLES.ADMIN, ROLES.HR),
  validate(allocateBalanceSchema, 'body'),
  leaveController.allocateBalance
);

// ==========================================
// 3. EMPLOYEE LEAVE REQUESTS
// ==========================================

// My leave application history (Paginated + filtered by status/year)
router.get(
  '/my-requests',
  validate(leaveHistoryQuerySchema, 'query'),
  leaveController.getMyLeaveRequests
);

// Apply for a new leave
router.post(
  '/apply',
  validate(applyLeaveSchema, 'body'),
  leaveController.applyLeave
);

// Cancel a pending leave request
router.put('/cancel/:id', leaveController.cancelLeave);

// ==========================================
// 4. ADMIN & MANAGER LEAVE APPROVALS
// ==========================================

// List all employee leave applications (Admin, HR, Manager)
router.get(
  '/admin/requests',
  authorize(ROLES.ADMIN, ROLES.HR, ROLES.MANAGER),
  validate(adminLeaveQuerySchema, 'query'),
  leaveController.getAdminLeaveRequests
);

// Approve or reject a leave application (Admin, HR, Manager)
router.patch(
  '/admin/action/:id',
  authorize(ROLES.ADMIN, ROLES.HR, ROLES.MANAGER),
  validate(actionLeaveSchema, 'body'),
  leaveController.actionLeaveRequest
);

// ==========================================
// 5. HOLIDAYS ROUTES
// ==========================================

// List holidays
router.get(
  '/holidays',
  validate(holidayQuerySchema, 'query'),
  leaveController.getHolidays
);

// Add new holiday (Admin & HR)
router.post(
  '/holidays',
  authorize(ROLES.ADMIN, ROLES.HR),
  validate(createHolidaySchema, 'body'),
  leaveController.createHoliday
);

// Remove holiday (Admin & HR)
router.delete(
  '/holidays/:id',
  authorize(ROLES.ADMIN, ROLES.HR),
  leaveController.deleteHoliday
);

// View detailed leave application by ID (Must be after specific routes)
router.get('/:id', leaveController.getLeaveRequestById);

module.exports = router;
