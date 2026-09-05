const ApiError = require('../utils/ApiError');
const { getEffectiveRole } = require('../utils/roleMapper');

/**
 * Role-based access control. Usage: authorize('DEAN', 'ADMINISTRATOR') or authorize('ADMIN', 'FACULTY').
 * Compares against both the user's raw role and their effectiveRole.
 * Must run after `authenticate`, which sets req.user.role.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const rawRole = req.user.role;
    const effectiveRole = getEffectiveRole(rawRole);

    const isAllowed =
      allowedRoles.includes(rawRole) ||
      allowedRoles.includes(effectiveRole);

    if (!isAllowed) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }

    next();
  };
}

module.exports = authorize;
