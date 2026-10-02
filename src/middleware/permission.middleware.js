const { ForbiddenError, UnauthorizedError } = require('../utils/apiError');
const { ROLES } = require('../constants/roles');

/**
 * Middleware to verify that the authenticated user possesses all specified permissions
 * @param  {...string} requiredPermissions e.g. 'users:create', 'users:read'
 */
const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
      }

      // Super admin / admin role bypass
      if (req.user.role === ROLES.ADMIN) {
        return next();
      }

      const effectivePermissions = await req.user.getEffectivePermissions();

      const missingPermissions = requiredPermissions.filter(
        (perm) => !effectivePermissions.includes(perm) && !effectivePermissions.includes('*')
      );

      if (missingPermissions.length > 0) {
        return next(
          new ForbiddenError(
            `Access denied. You lack the required permission(s): [${missingPermissions.join(', ')}]`
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to verify that the user possesses at least ONE of the specified permissions
 * @param  {...string} permissions e.g. 'users:read', 'users:manage'
 */
const requireAnyPermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
      }

      if (req.user.role === ROLES.ADMIN) {
        return next();
      }

      const effectivePermissions = await req.user.getEffectivePermissions();

      const hasAny = permissions.some(
        (p) => effectivePermissions.includes(p) || effectivePermissions.includes('*')
      );

      if (!hasAny) {
        return next(
          new ForbiddenError(
            `Access denied. Requires at least one of the following permissions: [${permissions.join(', ')}]`
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  requirePermission,
  requireAnyPermission
};
