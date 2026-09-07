const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/jwt.utils');

/**
 * Verifies the Bearer access token and attaches { id, roleId, role } to
 * req.user. Any protected route mounts this first.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication token missing'));
  }

  const token = header.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.sub,
      roleId: decoded.roleId,
      role: decoded.role,
      effectiveRole: decoded.effectiveRole,
    };
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired access token'));
  }
}

module.exports = authenticate;
