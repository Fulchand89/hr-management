const express = require('express');
const router = express.Router();

const policyController = require('../controllers/policy.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');
const { ROLES } = require('../constants/roles');

// All policy routes require authentication
router.use(authenticate);

// ─────────────────────────────────────────────
// EMPLOYEE & COMMON ROUTES
// ─────────────────────────────────────────────

// 1. List policies (Filtered by published status for standard employees)
router.get('/', policyController.getPolicies);

// 2. Get single policy detail with acknowledgment status
router.get('/:id', policyController.getPolicyById);

// 3. Employee digital acknowledgment ("I Agree")
router.post('/:id/acknowledge', policyController.acknowledgePolicy);

// ─────────────────────────────────────────────
// HR & ADMIN RESTRICTED MANAGEMENT ROUTES
// ─────────────────────────────────────────────
const adminOrHr = authorize(ROLES.ADMIN, ROLES.HR);

// 4. Create new policy with optional PDF document upload
router.post('/', adminOrHr, upload.single('attachment'), policyController.createPolicy);

// 5. Update policy metadata or document
router.put('/:id', adminOrHr, upload.single('attachment'), policyController.updatePolicy);

// 6. Set policy status (draft, published, archived)
router.patch('/:id/status', adminOrHr, policyController.setPolicyStatus);

// 7. Delete policy
router.delete('/:id', adminOrHr, policyController.deletePolicy);

// 8. Compliance & sign-off report for policy
router.get('/:id/compliance', adminOrHr, policyController.getPolicyCompliance);

// 9. Send reminder notifications to all pending employees
router.post('/:id/reminders', adminOrHr, policyController.sendPolicyReminders);

module.exports = router;
