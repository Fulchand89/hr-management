const express = require('express');
const router = express.Router();
const resignationController = require('../controllers/resignation.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

// All routes require authentication
router.use(authenticate);

// Employee routes
router.get('/mine', resignationController.getMyResignation);
router.post('/submit', resignationController.submitResignation);
router.post('/:id/withdraw', resignationController.withdrawResignation);

// Admin / HR routes
router.get('/', authorize('admin', 'hr', 'manager'), resignationController.getAllResignations);
router.get('/:id', authorize('admin', 'hr', 'manager'), resignationController.getResignationById);
router.patch('/:id/status', authorize('admin', 'hr', 'manager'), resignationController.updateResignationStatus);
router.patch('/:id/clearances/:clearanceId', authorize('admin', 'hr', 'manager'), resignationController.updateClearanceStatus);

module.exports = router;
