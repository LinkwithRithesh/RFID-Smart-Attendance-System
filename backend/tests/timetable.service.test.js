jest.mock('../src/repositories/timetable.repository', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  list: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

const timetableRepository = require('../src/repositories/timetable.repository');
const timetableService = require('../src/services/timetable.service');

const validPayload = {
  subjectId: 1,
  facultyId: 2,
  departmentId: 1,
  dayOfWeek: 'MON',
  startTime: '09:00',
  endTime: '10:00',
  semester: 3,
  academicYear: '2025-2026',
};

beforeEach(() => jest.clearAllMocks());

describe('createSlot', () => {
  test('rejects a slot where startTime is not before endTime', async () => {
    await expect(timetableService.createSlot({ ...validPayload, startTime: '10:00', endTime: '09:00' }))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(timetableRepository.create).not.toHaveBeenCalled();
  });

  test('rejects equal start and end time', async () => {
    await expect(timetableService.createSlot({ ...validPayload, startTime: '09:00', endTime: '09:00' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test('parses HH:MM strings into Date objects before storing', async () => {
    timetableRepository.create.mockImplementation(async (data) => ({ id: 1, ...data }));

    await timetableService.createSlot(validPayload);

    const callArg = timetableRepository.create.mock.calls[0][0];
    expect(callArg.startTime).toBeInstanceOf(Date);
    expect(callArg.startTime.getUTCHours()).toBe(9);
    expect(callArg.endTime.getUTCHours()).toBe(10);
  });
});

describe('getSlot / updateSlot / deleteSlot', () => {
  test('getSlot throws 404 for an unknown id', async () => {
    timetableRepository.findById.mockResolvedValue(null);
    await expect(timetableService.getSlot(999)).rejects.toMatchObject({ statusCode: 404 });
  });

  test('updateSlot throws 404 for an unknown id', async () => {
    timetableRepository.findById.mockResolvedValue(null);
    await expect(timetableService.updateSlot(999, { roomNumber: 'A1' })).rejects.toMatchObject({ statusCode: 404 });
  });

  test('updateSlot re-parses a changed startTime', async () => {
    timetableRepository.findById.mockResolvedValue({ id: 1 });
    timetableRepository.update.mockImplementation(async (id, data) => ({ id, ...data }));

    await timetableService.updateSlot(1, { startTime: '11:30' });

    const callArg = timetableRepository.update.mock.calls[0][1];
    expect(callArg.startTime).toBeInstanceOf(Date);
    expect(callArg.startTime.getUTCHours()).toBe(11);
    expect(callArg.startTime.getUTCMinutes()).toBe(30);
  });

  test('deleteSlot throws 404 for an unknown id', async () => {
    timetableRepository.findById.mockResolvedValue(null);
    await expect(timetableService.deleteSlot(999)).rejects.toMatchObject({ statusCode: 404 });
    expect(timetableRepository.remove).not.toHaveBeenCalled();
  });
});
