const analyticsService = require('../services/analytics.service');
const { success } = require('../utils/apiResponse');

async function userPercentage(req, res, next) {
  try {
    const result = await analyticsService.getUserAttendancePercentage(
      req.params.userId,
      new Date(req.query.from),
      new Date(req.query.to)
    );
    return success(res, 200, 'User attendance percentage retrieved', result);
  } catch (err) {
    next(err);
  }
}

async function departmentSummary(req, res, next) {
  try {
    const result = await analyticsService.getDepartmentSummary(
      req.params.departmentId,
      new Date(req.query.from),
      new Date(req.query.to),
      req.query.role
    );
    return success(res, 200, 'Department summary retrieved', result);
  } catch (err) {
    next(err);
  }
}

async function lowAttendance(req, res, next) {
  try {
    const result = await analyticsService.getLowAttendance(
      req.params.departmentId,
      new Date(req.query.from),
      new Date(req.query.to),
      req.query.role,
      req.query.threshold
    );
    return success(res, 200, 'Low attendance list retrieved', result);
  } catch (err) {
    next(err);
  }
}

module.exports = { userPercentage, departmentSummary, lowAttendance };
