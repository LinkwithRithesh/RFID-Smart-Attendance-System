const ApiError = require('../utils/ApiError');
const userRepository = require('../repositories/user.repository');
const notificationRepository = require('../repositories/notification.repository');
const analyticsService = require('./analytics.service');
const emailService = require('./email.service');
const pushProvider = require('./pushProvider');

/**
 * Creates a Notification row per channel and attempts delivery immediately.
 * Each channel is independent — email failing doesn't affect push, and
 * vice versa. Never throws: delivery failures are reflected in the stored
 * status (FAILED), not as thrown errors, since a failed notification should
 * never break whatever triggered it (e.g. marking attendance).
 */
async function notifyUser(userId, type, title, message, channels = ['EMAIL', 'PUSH']) {
  const user = await userRepository.findById(userId);
  if (!user) {
    return [];
  }

  const results = [];
  for (const channel of channels) {
    const notification = await notificationRepository.create({
      userId,
      title,
      message,
      channel,
      type,
      status: 'PENDING',
    });

    let deliveryResult;
    if (channel === 'EMAIL') {
      deliveryResult = await emailService.sendEmail({ to: user.email, subject: title, text: message });
    } else {
      deliveryResult = await pushProvider.sendPush(user, title, message);
    }

    const finalStatus = deliveryResult.delivered ? 'SENT' : 'FAILED';
    const updated = await notificationRepository.updateStatus(notification.id, finalStatus);
    results.push({ ...updated, deliveryReason: deliveryResult.reason });
  }

  return results;
}

async function listNotifications(userId, { page, limit, unreadOnly }) {
  const [notifications, total] = await notificationRepository.listForUser(userId, { page, limit, unreadOnly });
  return { notifications, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function markAsRead(notificationId, userId) {
  const notification = await notificationRepository.findById(notificationId);
  if (!notification || notification.userId !== userId) {
    throw new ApiError(404, 'Notification not found');
  }
  return notificationRepository.markRead(notificationId);
}

/**
 * Staff-triggered (no cron scheduler in scope): computes the low-attendance
 * list via Module 9's analytics and fires an alert to each affected user.
 */
async function sendLowAttendanceAlerts(departmentId, from, to, roleName, threshold) {
  const lowAttendanceUsers = await analyticsService.getLowAttendance(departmentId, from, to, roleName, threshold);

  await Promise.all(
    lowAttendanceUsers.map((u) =>
      notifyUser(
        u.userId,
        'LOW_ATTENDANCE_ALERT',
        'Low Attendance Alert',
        `Your attendance is ${u.percentage}%, below the required ${threshold ?? 75}%. Please contact your department.`
      )
    )
  );

  return { alertsSent: lowAttendanceUsers.length, users: lowAttendanceUsers };
}

module.exports = { notifyUser, listNotifications, markAsRead, sendLowAttendanceAlerts };
