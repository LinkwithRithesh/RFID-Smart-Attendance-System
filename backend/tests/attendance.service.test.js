jest.mock('../src/repositories/user.repository', () => ({
  findByRfidCardId: jest.fn(),
}));
jest.mock('../src/repositories/attendance.repository', () => ({
  findAttendance: jest.fn(),
  createAttendance: jest.fn(),
  listBySession: jest.fn(),
}));
jest.mock('../src/repositories/attendanceSession.repository', () => ({
  findById: jest.fn(),
}));
jest.mock('../src/services/attendanceSession.service', () => ({
  resolveActiveSession: jest.fn(),
  resolveHistoricalSession: jest.fn(),
}));
jest.mock('../src/services/notification.service', () => ({
  notifyUser: jest.fn().mockResolvedValue([]),
}));
jest.mock('../src/repositories/auditLog.repository', () => ({
  log: jest.fn(),
}));

const userRepository = require('../src/repositories/user.repository');
const attendanceRepository = require('../src/repositories/attendance.repository');
const sessionRepository = require('../src/repositories/attendanceSession.repository');
const attendanceSessionService = require('../src/services/attendanceSession.service');
const notificationService = require('../src/services/notification.service');
const auditLogRepository = require('../src/repositories/auditLog.repository');
const attendanceService = require('../src/services/attendance.service');

const device = { id: 7, departmentId: 1 };

function makeSession(overrides = {}) {
  return {
    id: 100,
    departmentId: 1,
    status: 'OPEN',
    sessionDate: new Date('2026-07-29T00:00:00Z'),
    startTime: new Date('1970-01-01T09:00:00Z'),
    endTime: new Date('1970-01-01T10:00:00Z'),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  auditLogRepository.log.mockResolvedValue({});
});

describe('markAttendanceByRfid', () => {
  test('rejects an unknown RFID card', async () => {
    userRepository.findByRfidCardId.mockResolvedValue(null);
    await expect(attendanceService.markAttendanceByRfid(device, 'BAD-CARD')).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(attendanceSessionService.resolveActiveSession).not.toHaveBeenCalled();
  });

  test('rejects an RFID card belonging to a deactivated user', async () => {
    userRepository.findByRfidCardId.mockResolvedValue({ id: 5, isActive: false });
    await expect(attendanceService.markAttendanceByRfid(device, 'CARD-1')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  test('rejects when no attendance session is open for the department', async () => {
    userRepository.findByRfidCardId.mockResolvedValue({ id: 5, isActive: true });
    attendanceSessionService.resolveActiveSession.mockResolvedValue(null);

    await expect(attendanceService.markAttendanceByRfid(device, 'CARD-1')).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(attendanceRepository.findAttendance).not.toHaveBeenCalled();
  });

  test('rejects a duplicate mark for the same session', async () => {
    userRepository.findByRfidCardId.mockResolvedValue({ id: 5, isActive: true });
    attendanceSessionService.resolveActiveSession.mockResolvedValue(makeSession());
    attendanceRepository.findAttendance.mockResolvedValue({ id: 1 });

    await expect(attendanceService.markAttendanceByRfid(device, 'CARD-1')).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(attendanceRepository.createAttendance).not.toHaveBeenCalled();
  });

  test('marks PRESENT and stores via device method, with an audit log entry', async () => {
    userRepository.findByRfidCardId.mockResolvedValue({ id: 5, isActive: true });
    attendanceSessionService.resolveActiveSession.mockResolvedValue(makeSession());
    attendanceRepository.findAttendance.mockResolvedValue(null);
    attendanceRepository.createAttendance.mockImplementation(async (data) => ({ id: 999, ...data }));

    // Freeze "now" to just after session start (09:00) -> PRESENT
    jest.useFakeTimers().setSystemTime(new Date('2026-07-29T09:02:00Z'));

    const result = await attendanceService.markAttendanceByRfid(device, 'CARD-1');

    expect(attendanceRepository.createAttendance).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 100,
        userId: 5,
        deviceId: 7,
        method: 'RFID_FACE',
        status: 'PRESENT',
      })
    );
    expect(result.status).toBe('PRESENT');
    expect(auditLogRepository.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ATTENDANCE_MARKED', actorId: 5 })
    );
    expect(notificationService.notifyUser).toHaveBeenCalledWith(
      5, 'ATTENDANCE_CONFIRMATION', expect.any(String), expect.stringContaining('PRESENT')
    );

    jest.useRealTimers();
  });

  test('marks LATE when well past the grace window', async () => {
    userRepository.findByRfidCardId.mockResolvedValue({ id: 5, isActive: true });
    attendanceSessionService.resolveActiveSession.mockResolvedValue(makeSession());
    attendanceRepository.findAttendance.mockResolvedValue(null);
    attendanceRepository.createAttendance.mockImplementation(async (data) => ({ id: 999, ...data }));

    jest.useFakeTimers().setSystemTime(new Date('2026-07-29T09:45:00Z'));

    const result = await attendanceService.markAttendanceByRfid(device, 'CARD-1');
    expect(result.status).toBe('LATE');

    jest.useRealTimers();
  });
});

describe('markManual', () => {
  test('rejects an unknown session', async () => {
    sessionRepository.findById.mockResolvedValue(null);
    await expect(attendanceService.markManual({ sessionId: 999, userId: 5, status: 'PRESENT' }, 1))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  test('rejects a duplicate mark', async () => {
    sessionRepository.findById.mockResolvedValue(makeSession());
    attendanceRepository.findAttendance.mockResolvedValue({ id: 1 });
    await expect(attendanceService.markManual({ sessionId: 100, userId: 5, status: 'PRESENT' }, 1))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  test('stores the explicit status the caller provided, unmodified', async () => {
    sessionRepository.findById.mockResolvedValue(makeSession());
    attendanceRepository.findAttendance.mockResolvedValue(null);
    attendanceRepository.createAttendance.mockImplementation(async (data) => ({ id: 999, ...data }));

    const result = await attendanceService.markManual({ sessionId: 100, userId: 5, status: 'ABSENT' }, 42);

    expect(attendanceRepository.createAttendance).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'MANUAL', status: 'ABSENT', deviceId: null })
    );
    expect(result.status).toBe('ABSENT');
    expect(auditLogRepository.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ATTENDANCE_MARKED_MANUAL', actorId: 42 })
    );
  });
});

describe('syncOfflineRecords', () => {
  const pastTimestamp = '2026-07-29T09:05:00.000Z';

  test('syncs a valid record and marks it isSynced with a syncedAt timestamp', async () => {
    userRepository.findByRfidCardId.mockResolvedValue({ id: 5, isActive: true });
    attendanceSessionService.resolveHistoricalSession.mockResolvedValue(makeSession());
    attendanceRepository.findAttendance.mockResolvedValue(null);
    attendanceRepository.createAttendance.mockImplementation(async (data) => ({ id: 1, ...data }));

    const result = await attendanceService.syncOfflineRecords(device, [
      { rfidCardId: 'CARD-1', markedAt: pastTimestamp },
    ]);

    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
    expect(attendanceRepository.createAttendance).toHaveBeenCalledWith(
      expect.objectContaining({ isSynced: true, syncedAt: expect.any(Date), method: 'RFID_FACE' })
    );
    expect(result.results[0]).toMatchObject({ status: 'SYNCED', rfidCardId: 'CARD-1' });
  });

  test('fails a record with an unknown RFID card without touching other records', async () => {
    userRepository.findByRfidCardId
      .mockResolvedValueOnce(null) // record 1: bad card
      .mockResolvedValueOnce({ id: 5, isActive: true }); // record 2: good card
    attendanceSessionService.resolveHistoricalSession.mockResolvedValue(makeSession());
    attendanceRepository.findAttendance.mockResolvedValue(null);
    attendanceRepository.createAttendance.mockImplementation(async (data) => ({ id: 2, ...data }));

    const result = await attendanceService.syncOfflineRecords(device, [
      { rfidCardId: 'BAD-CARD', markedAt: pastTimestamp },
      { rfidCardId: 'GOOD-CARD', markedAt: pastTimestamp },
    ]);

    expect(result.total).toBe(2);
    expect(result.synced).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.results[0]).toMatchObject({ status: 'FAILED', reason: expect.stringContaining('Invalid') });
    expect(result.results[1]).toMatchObject({ status: 'SYNCED' });
  });

  test('fails a record when no window (live or backfilled) covered that timestamp', async () => {
    userRepository.findByRfidCardId.mockResolvedValue({ id: 5, isActive: true });
    attendanceSessionService.resolveHistoricalSession.mockResolvedValue(null);

    const result = await attendanceService.syncOfflineRecords(device, [
      { rfidCardId: 'CARD-1', markedAt: pastTimestamp },
    ]);

    expect(result.failed).toBe(1);
    expect(result.results[0].reason).toMatch(/no attendance window/i);
    expect(attendanceRepository.createAttendance).not.toHaveBeenCalled();
  });

  test('fails a record that was already marked (duplicate)', async () => {
    userRepository.findByRfidCardId.mockResolvedValue({ id: 5, isActive: true });
    attendanceSessionService.resolveHistoricalSession.mockResolvedValue(makeSession());
    attendanceRepository.findAttendance.mockResolvedValue({ id: 1 });

    const result = await attendanceService.syncOfflineRecords(device, [
      { rfidCardId: 'CARD-1', markedAt: pastTimestamp },
    ]);

    expect(result.failed).toBe(1);
    expect(result.results[0].reason).toMatch(/already marked/i);
  });

  test('one record throwing an unexpected error does not abort the rest of the batch', async () => {
    userRepository.findByRfidCardId
      .mockRejectedValueOnce(new Error('DB blip'))
      .mockResolvedValueOnce({ id: 5, isActive: true });
    attendanceSessionService.resolveHistoricalSession.mockResolvedValue(makeSession());
    attendanceRepository.findAttendance.mockResolvedValue(null);
    attendanceRepository.createAttendance.mockImplementation(async (data) => ({ id: 3, ...data }));

    const result = await attendanceService.syncOfflineRecords(device, [
      { rfidCardId: 'CARD-1', markedAt: pastTimestamp },
      { rfidCardId: 'CARD-2', markedAt: pastTimestamp },
    ]);

    expect(result.synced).toBe(1);
    expect(result.failed).toBe(1);
  });
});

describe('listSessionAttendance', () => {
  test('rejects an unknown session', async () => {
    sessionRepository.findById.mockResolvedValue(null);
    await expect(attendanceService.listSessionAttendance(999)).rejects.toMatchObject({ statusCode: 404 });
  });

  test('returns records with the user attached', async () => {
    sessionRepository.findById.mockResolvedValue(makeSession());
    attendanceRepository.listBySession.mockResolvedValue([
      { id: 1, sessionId: 100, userId: 5, deviceId: 7, method: 'RFID_FACE', status: 'PRESENT', markedAt: new Date(), user: { id: 5, fullName: 'Alice' } },
    ]);

    const result = await attendanceService.listSessionAttendance(100);
    expect(result[0].user).toEqual({ id: 5, fullName: 'Alice' });
  });
});
