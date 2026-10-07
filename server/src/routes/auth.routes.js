const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../validators/auth.validator');
const { updateProfileSchema, changePasswordSchema } = require('../validators/user.validator');

// Public Authentication Endpoints
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Protected Authentication Endpoints
router.get('/me', authenticate, authController.getProfile);
router.put('/me', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
