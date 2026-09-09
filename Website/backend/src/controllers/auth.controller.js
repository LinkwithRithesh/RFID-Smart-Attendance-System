const authService = require('../services/auth.service');
const userRepository = require('../repositories/user.repository');
const { success } = require('../utils/apiResponse');

async function register(req, res, next) {
  try {
    const { otp, email } = await authService.register(req.body);
    const responseData = { email };
    if (process.env.REGISTRATION_OTP_MODE === 'development') {
      responseData.devOtp = otp;
    }
    return success(res, 200, 'OTP sent successfully.', responseData);
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyRegisterOtp(email, otp);
    return success(res, 200, 'Registration submitted for administrator approval.', result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, loginId, password } = req.body;
    const identifier = email || loginId;
    const result = await authService.login(identifier, password, req.ip);
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
    await authService.logout(req.user?.id);
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

async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, oldPassword, newPassword, req.ip);
    return success(res, 200, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  verifyOtp,
  login,
  refresh,
  logout,
  me,
  changePassword,
};
