jest.mock('../src/repositories/user.repository', () => ({
  findById: jest.fn(),
}));
jest.mock('../src/repositories/notification.repository', () => ({
  create: jest.fn(),
  updateStatus: jest.fn(),
  findById: jest.fn(),
  listForUser: jest.fn(),
  markRead: jest.fn(),
}));
jest.mock('../src/services/analytics.service', () => ({
  getLowAttendance: jest.fn(),
}));
jest.mock('../src/services/email.service', () => ({
  sendEmail: jest.fn(),
}));
jest.mock('../src/services/pushProvider', () => ({
  sendPush: jest.fn(),
}));

const userRepository = require('../src/repositories/user.repository');
const notificationRepository = require('../src/repositories/notification.repository');
const analyticsService = require('../src/services/analytics.service');
const emailService = require('../src/services/email.service');
const pushProvider = require('../src/services/pushProvider');
const notificationService = require('../src/services/notification.service');

beforeEach(() => {
  jest.clearAllMocks();
  notificationRepository.create.mockImplementation(async (data) => ({ id: Math.random(), ...data }));
  notificationRepository.updateStatus.mockImplementation(async (id, status) => ({ id, status }));
});

describe('notifyUser', () => {
  test('returns an empty array for an unknown user, without creating any rows', async () => {
    userRepository.findById.mockResolvedValue(null);
    const result = await notificationService.notifyUser(999, 'GENERAL', 'Title', 'Msg');
    expect(result).toEqual([]);
    expect(notificationRepository.create).not.toHaveBeenCalled();
  });

  test('marks the EMAIL channel SENT when delivery succeeds', async () => {
    userRepository.findById.mockResolvedValue({ id: 1, email: 'alice@campus.edu' });
    emailService.sendEmail.mockResolvedValue({ delivered: true });

    const results = await notificationService.notifyUser(1, 'GENERAL', 'Title', 'Msg', ['EMAIL']);

    expect(notificationRepository.updateStatus).toHaveBeenCalledWith(expect.anything(), 'SENT');
    expect(results[0].status).toBe('SENT');
  });

  test('marks the EMAIL channel FAILED when delivery fails, without throwing', async () => {
    userRepository.findById.mockResolvedValue({ id: 1, email: 'alice@campus.edu' });
    emailService.sendEmail.mockResolvedValue({ delivered: false, reason: 'SMTP down' });

    const results = await notificationService.notifyUser(1, 'GENERAL', 'Title', 'Msg', ['EMAIL']);

    expect(notificationRepository.updateStatus).toHaveBeenCalledWith(expect.anything(), 'FAILED');
    expect(results[0].status).toBe('FAILED');
    expect(results[0].deliveryReason).toBe('SMTP down');
  });

  test('PUSH channel is always marked FAILED via the honest stub, independent of EMAIL result', async () => {
    userRepository.findById.mockResolvedValue({ id: 1, email: 'alice@campus.edu' });
    emailService.sendEmail.mockResolvedValue({ delivered: true });
    pushProvider.sendPush.mockResolvedValue({ delivered: false, reason: 'Push provider not configured' });

    const results = await notificationService.notifyUser(1, 'GENERAL', 'Title', 'Msg', ['EMAIL', 'PUSH']);

    expect(results).toHaveLength(2);
    expect(results.find((r) => r.status === 'SENT')).toBeTruthy();
    expect(results.find((r) => r.status === 'FAILED')).toBeTruthy();
  });
});

describe('markAsRead', () => {
  test('throws 404 when the notification does not exist', async () => {
    notificationRepository.findById.mockResolvedValue(null);
    await expect(notificationService.markAsRead(999, 1)).rejects.toMatchObject({ statusCode: 404 });
  });

  test('throws 404 when the notification belongs to a different user', async () => {
    notificationRepository.findById.mockResolvedValue({ id: 1, userId: 2 });
    await expect(notificationService.markAsRead(1, 1)).rejects.toMatchObject({ statusCode: 404 });
    expect(notificationRepository.markRead).not.toHaveBeenCalled();
  });

  test('marks read when the notification belongs to the requesting user', async () => {
    notificationRepository.findById.mockResolvedValue({ id: 1, userId: 1 });
    notificationRepository.markRead.mockResolvedValue({ id: 1, readAt: new Date() });

    const result = await notificationService.markAsRead(1, 1);
    expect(notificationRepository.markRead).toHaveBeenCalledWith(1);
    expect(result.readAt).toBeInstanceOf(Date);
  });
});

describe('sendLowAttendanceAlerts', () => {
  test('sends an alert to each user below the threshold and returns a count', async () => {
    analyticsService.getLowAttendance.mockResolvedValue([
      { userId: 1, fullName: 'Alice', percentage: 60 },
      { userId: 2, fullName: 'Bob', percentage: 50 },
    ]);
    userRepository.findById.mockResolvedValue({ id: 1, email: 'x@campus.edu' });
    emailService.sendEmail.mockResolvedValue({ delivered: true });
    pushProvider.sendPush.mockResolvedValue({ delivered: false, reason: 'not configured' });

    const result = await notificationService.sendLowAttendanceAlerts(1, new Date(), new Date(), undefined, 75);

    expect(result.alertsSent).toBe(2);
  });

  test('sends nothing when nobody is below the threshold', async () => {
    analyticsService.getLowAttendance.mockResolvedValue([]);
    const result = await notificationService.sendLowAttendanceAlerts(1, new Date(), new Date(), undefined, 75);
    expect(result.alertsSent).toBe(0);
  });
});
