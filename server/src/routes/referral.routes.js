const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

router.use(authenticate);

// Employee routes
router.get('/mine', referralController.getMyReferrals);
router.post('/submit', upload.single('resume'), referralController.createReferral);

// HR / Admin routes
router.get('/', authorize('admin', 'hr', 'manager'), referralController.getAllReferrals);
router.get('/:id', authorize('admin', 'hr', 'manager'), referralController.getReferralById);
router.patch('/:id', authorize('admin', 'hr', 'manager'), referralController.updateReferral);

module.exports = router;
