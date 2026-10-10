const express = require('express');
const router = express.Router();
const appraisalController = require('../controllers/appraisal.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.use(authenticate);

// Employee routes
router.get('/mine', appraisalController.getMyAppraisals);

// HR / Admin routes
router.get('/', authorize('admin', 'hr', 'manager'), appraisalController.getAllAppraisals);
router.post('/', authorize('admin', 'hr', 'manager'), appraisalController.createAppraisalReview);
router.get('/employee/:userId', authorize('admin', 'hr', 'manager'), appraisalController.getEmployeeAppraisals);
router.get('/:id', authorize('admin', 'hr', 'manager'), appraisalController.getAppraisalById);

module.exports = router;
