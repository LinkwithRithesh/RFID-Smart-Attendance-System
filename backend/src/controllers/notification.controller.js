const notificationService = require('../services/notification.service');
const { success } = require('../utils/apiResponse');

async function listNotifications(req, res, next) {
  try {
    const result = await notificationService.listNotifications(req.user.id, req.query);
    return success(res, 200, 'Notifications retrieved', result);
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    return success(res, 200, 'Notification marked as read', notification);
  } catch (err) {
    next(err);
  }
}

async function sendLowAttendanceAlerts(req, res, next) {
  try {
    const { departmentId, from, to, role, threshold } = req.body;
    const result = await notificationService.sendLowAttendanceAlerts(
      departmentId,
      new Date(from),
      new Date(to),
      role,
      threshold
    );
    return success(res, 200, 'Low attendance alerts sent', result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotifications, markAsRead, sendLowAttendanceAlerts };
