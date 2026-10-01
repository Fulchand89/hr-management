const { ForbiddenError, UnauthorizedError } = require('../utils/apiError');

/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...string} roles Allowed roles (e.g. 'admin', 'hr', 'manager')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Permission denied. Role '${req.user.role}' is not authorized to access this resource. Allowed roles: [${roles.join(', ')}]`
        )
      );
    }

    next();
  };
};

module.exports = authorize;
