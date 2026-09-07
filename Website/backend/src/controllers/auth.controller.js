const authService = require('../services/auth.service');
const userRepository = require('../repositories/user.repository');
const { success } = require('../utils/apiResponse');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password, req.ip);
    return success(res, 200, 'Login successful', result);
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refresh(refreshToken);
    return success(res, 200, 'Token refreshed', tokens);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.user.id);
    return success(res, 200, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const { getEffectiveRole } = require('../utils/roleMapper');
    const user = await userRepository.findById(req.user.id);
    const role = user.role.name;
    return success(res, 200, 'Current user', {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role,
      effectiveRole: getEffectiveRole(role),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, refresh, logout, me };
