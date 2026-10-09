const express = require('express');
const router = express.Router();

const payrollController = require('../controllers/payroll.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

// All payroll routes require authentication
router.use(authenticate);

// ─────────────────────────────────────────────
// EMPLOYEE SELF-SERVICE ROUTES
// ─────────────────────────────────────────────
router.get('/my-payslips', payrollController.getMyPayslips);

// Formatted Payslip for print/download (HR/Admin or own record)
router.get('/:id/payslip', payrollController.getPayslipDetails);

// ─────────────────────────────────────────────
// HR / ADMIN MANAGEMENT ROUTES
// ─────────────────────────────────────────────
const adminOrHr = authorize(ROLES.ADMIN, ROLES.HR);

// 1. Batch Generate Monthly Payroll
router.post('/generate', adminOrHr, payrollController.generatePayroll);

// 2. Export Bank Transfer Sheet CSV
router.get('/export-bank-sheet', adminOrHr, payrollController.exportBankSheet);

// 3. Monthly KPI Summary
router.get('/summary', adminOrHr, payrollController.getPayrollSummary);

// 4. Get Directory with Filters & Pagination
router.get('/', adminOrHr, payrollController.getPayrollDirectory);

// 5. Bulk Disburse
router.post('/bulk-disburse', adminOrHr, payrollController.bulkDisburse);

// 6. Get Single Payroll Record
router.get('/:id', adminOrHr, payrollController.getPayrollById);

// 7. Adjust Payroll (Bonus/Penalty)
router.put('/:id/adjust', adminOrHr, payrollController.adjustPayroll);

// 8. Update Single Status
router.patch('/:id/status', adminOrHr, payrollController.updatePayrollStatus);

module.exports = router;
