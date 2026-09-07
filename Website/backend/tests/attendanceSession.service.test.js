jest.mock('../src/repositories/attendanceSession.repository', () => ({
  findById: jest.fn(),
  findOpenForDepartment: jest.fn(),
  findAllOpenForDepartment: jest.fn(),
  findSessionCoveringTimestamp: jest.fn(),
  closeSession: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../src/repositories/timetable.repository', () => ({
  findSlotCoveringNow: jest.fn(),
}));
jest.mock('../src/repositories/auditLog.repository', () => ({
  log: jest.fn(),
}));

const sessionRepository = require('../src/repositories/attendanceSession.repository');
const timetableRepository = require('../src/repositories/timetable.repository');
const auditLogRepository = require('../src/repositories/auditLog.repository');
const attendanceSessionService = require('../src/services/attendanceSession.service');

function makeSession(overrides = {}) {
  return {
    id: 1,
    departmentId: 1,
    status: 'OPEN',
    overrideType: 'NONE',
    sessionDate: new Date('2026-07-29T00:00:00Z'),
    startTime: new Date('1970-01-01T09:00:00Z'),
    endTime: new Date('1970-01-01T10:00:00Z'),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  auditLogRepository.log.mockResolvedValue({});
  sessionRepository.create.mockImplementation(async (data) => ({ id: 999, ...data }));
});

describe('resolveActiveSession', () => {
  test('auto-closes an expired open session instead of returning it', async () => {
    const expired = makeSession({ id: 1 }); // ends 10:00, "now" below is 11:00
    sessionRepository.findAllOpenForDepartment.mockResolvedValue([expired]);
    timetableRepository.findSlotCoveringNow.mockResolvedValue(null);

    const now = new Date('2026-07-29T11:00:00Z');
    const result = await attendanceSessionService.resolveActiveSession(1, now);

    expect(sessionRepository.closeSession).toHaveBeenCalledWith(1, 'CLOSED');
    expect(result).toBeNull();
  });

  test('returns a still-valid open session without touching the timetable', async () => {
    const active = makeSession({ id: 2 }); // 09:00-10:00, "now" is 09:30 -> still valid
    sessionRepository.findAllOpenForDepartment.mockResolvedValue([active]);

    const now = new Date('2026-07-29T09:30:00Z');
    const result = await attendanceSessionService.resolveActiveSession(1, now);

    expect(result.id).toBe(2);
    expect(sessionRepository.closeSession).not.toHaveBeenCalled();
    expect(timetableRepository.findSlotCoveringNow).not.toHaveBeenCalled();
  });

  test('auto-opens a CLASS session from the timetable when no session exists but a slot matches', async () => {
    sessionRepository.findAllOpenForDepartment.mockResolvedValue([]);
    timetableRepository.findSlotCoveringNow.mockResolvedValue({
      id: 55, subjectId: 3, facultyId: 7, startTime: new Date('1970-01-01T09:00:00Z'), endTime: new Date('1970-01-01T10:00:00Z'),
    });

    const now = new Date('2026-07-29T09:15:00Z');
    const result = await attendanceSessionService.resolveActiveSession(1, now);

    expect(sessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ sessionType: 'CLASS', timetableId: 55, overrideType: 'NONE', status: 'OPEN' })
    );
    expect(result.timetableId).toBe(55);
  });

  test('returns null when nothing is open and no timetable slot matches', async () => {
    sessionRepository.findAllOpenForDepartment.mockResolvedValue([]);
    timetableRepository.findSlotCoveringNow.mockResolvedValue(null);

    const result = await attendanceSessionService.resolveActiveSession(1, new Date());
    expect(result).toBeNull();
    expect(sessionRepository.create).not.toHaveBeenCalled();
  });
});

describe('openManualSession', () => {
  const FROZEN_NOW = new Date('2026-07-29T09:30:00Z'); // inside makeSession()'s 09:00-10:00 window

  test('opens freely when nothing is currently active', async () => {
    sessionRepository.findAllOpenForDepartment.mockResolvedValue([]);

    const session = await attendanceSessionService.openManualSession(
      { departmentId: 1, durationMinutes: 30 },
      { id: 10, role: 'HOD' },
      FROZEN_NOW
    );

    expect(session.overrideType).toBe('HOD');
    expect(auditLogRepository.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ATTENDANCE_SESSION_MANUAL_OPENED' })
    );
  });

  test('HOD cannot override an already-active DEAN session', async () => {
    sessionRepository.findAllOpenForDepartment.mockResolvedValue([makeSession({ overrideType: 'DEAN' })]);

    await expect(
      attendanceSessionService.openManualSession({ departmentId: 1 }, { id: 10, role: 'HOD' }, FROZEN_NOW)
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(sessionRepository.create).not.toHaveBeenCalled();
  });

  test('DEAN can override an active HOD session, which gets cancelled', async () => {
    const hodSession = makeSession({ id: 5, overrideType: 'HOD' });
    sessionRepository.findAllOpenForDepartment.mockResolvedValue([hodSession]);

    await attendanceSessionService.openManualSession({ departmentId: 1 }, { id: 20, role: 'DEAN' }, FROZEN_NOW);

    expect(sessionRepository.closeSession).toHaveBeenCalledWith(5, 'CANCELLED');
    expect(sessionRepository.create).toHaveBeenCalledWith(expect.objectContaining({ overrideType: 'DEAN' }));
  });

  test('an EMERGENCY flag outranks even an active DEAN session, regardless of the caller role', async () => {
    sessionRepository.findAllOpenForDepartment.mockResolvedValue([makeSession({ overrideType: 'DEAN' })]);

    const session = await attendanceSessionService.openManualSession(
      { departmentId: 1, isEmergency: true },
      { id: 30, role: 'HOD' },
      FROZEN_NOW
    );

    expect(session.overrideType).toBe('EMERGENCY');
    expect(auditLogRepository.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ATTENDANCE_SESSION_EMERGENCY_OPENED' })
    );
  });

  test('same-rank cannot override same-rank', async () => {
    sessionRepository.findAllOpenForDepartment.mockResolvedValue([makeSession({ overrideType: 'HOD' })]);

    await expect(
      attendanceSessionService.openManualSession({ departmentId: 1 }, { id: 40, role: 'HOD' }, FROZEN_NOW)
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('resolveHistoricalSession', () => {
  test('returns an existing session that covered that past timestamp, without closing anything', async () => {
    const historical = makeSession({ id: 8, status: 'CLOSED' });
    sessionRepository.findSessionCoveringTimestamp.mockResolvedValue(historical);

    const result = await attendanceSessionService.resolveHistoricalSession(1, new Date('2026-07-29T09:15:00Z'));

    expect(result.id).toBe(8);
    expect(sessionRepository.closeSession).not.toHaveBeenCalled();
  });

  test('backfills a CLOSED session from the timetable when none was ever created live', async () => {
    sessionRepository.findSessionCoveringTimestamp.mockResolvedValue(null);
    timetableRepository.findSlotCoveringNow.mockResolvedValue({
      id: 77, subjectId: 4, facultyId: 9,
      startTime: new Date('1970-01-01T09:00:00Z'), endTime: new Date('1970-01-01T10:00:00Z'),
    });

    const result = await attendanceSessionService.resolveHistoricalSession(1, new Date('2026-07-29T09:15:00Z'));

    expect(sessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ timetableId: 77, status: 'CLOSED', overrideType: 'NONE' })
    );
    expect(result.timetableId).toBe(77);
  });

  test('returns null when there was never a session and no timetable slot covers that time', async () => {
    sessionRepository.findSessionCoveringTimestamp.mockResolvedValue(null);
    timetableRepository.findSlotCoveringNow.mockResolvedValue(null);

    const result = await attendanceSessionService.resolveHistoricalSession(1, new Date('2026-07-29T23:00:00Z'));
    expect(result).toBeNull();
  });
});

describe('closeSessionManually', () => {
  test('throws 404 for an unknown session', async () => {
    sessionRepository.findById.mockResolvedValue(null);
    await expect(
      attendanceSessionService.closeSessionManually(999, { id: 1, role: 'ADMIN' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test('throws 409 if the session is not open', async () => {
    sessionRepository.findById.mockResolvedValue(makeSession({ status: 'CLOSED' }));
    await expect(
      attendanceSessionService.closeSessionManually(1, { id: 1, role: 'ADMIN' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test('an HOD cannot close a DEAN-opened session', async () => {
    sessionRepository.findById.mockResolvedValue(makeSession({ overrideType: 'DEAN' }));
    await expect(
      attendanceSessionService.closeSessionManually(1, { id: 1, role: 'HOD' })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test('ADMIN can close an HOD-opened session', async () => {
    sessionRepository.findById.mockResolvedValue(makeSession({ overrideType: 'HOD' }));
    sessionRepository.closeSession.mockResolvedValue({});

    await attendanceSessionService.closeSessionManually(1, { id: 1, role: 'ADMIN' });
    expect(sessionRepository.closeSession).toHaveBeenCalledWith(1, 'CLOSED');
  });

  test('any of HOD/DEAN/ADMIN can close an automatic (NONE) session', async () => {
    sessionRepository.findById.mockResolvedValue(makeSession({ overrideType: 'NONE' }));
    sessionRepository.closeSession.mockResolvedValue({});

    await attendanceSessionService.closeSessionManually(1, { id: 1, role: 'HOD' });
    expect(sessionRepository.closeSession).toHaveBeenCalledWith(1, 'CLOSED');
  });
});
