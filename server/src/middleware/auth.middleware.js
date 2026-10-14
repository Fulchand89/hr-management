const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');
const { UnauthorizedError, ForbiddenError } = require('../utils/apiError');
const { USER_STATUS } = require('../constants/status');

/**
 * Authentication Middleware: Validates Bearer token from header or cookie
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new UnauthorizedError('Access token required. Please log in.'));
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT.SECRET);

    // Fetch user from DB
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return next(new UnauthorizedError('User account associated with this token no longer exists.'));
    }

    const isAdminOrHr = ['admin', 'hr', 'ADMIN', 'HR'].includes(user.role);

    if (user.status === USER_STATUS.SUSPENDED) {
      if (!isAdminOrHr) {
        return next(new ForbiddenError('Your account has been suspended. Please contact HR administration.'));
      }
    }

    if (user.status === USER_STATUS.TERMINATED) {
      if (!isAdminOrHr) {
        return next(new ForbiddenError('Your employment has been terminated. Access revoked.'));
      }
    }

    if (user.status === USER_STATUS.RESIGNED) {
      if (!isAdminOrHr) {
        // Resigned employees should still be able to view their own resignation, exit clearance, profile, and notifications
        const allowedSubstrings = ['/resignations', '/employees/me', '/auth/me', '/notifications'];
        const isAllowed = allowedSubstrings.some((sub) => req.originalUrl.includes(sub) || req.baseUrl.includes(sub));
        if (!isAllowed) {
          return next(new ForbiddenError('Your employment status is resigned. Access to standard operations revoked.'));
        }
      }
    }

    if (user.status === USER_STATUS.INACTIVE) {
      if (!isAdminOrHr) {
        return next(new ForbiddenError('Your account is currently inactive. Please contact HR administration.'));
      }
    }

    // Attach user object to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Access token has expired. Please refresh your session.'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid access token.'));
    }
    next(error);
  }
};

module.exports = authenticate;
