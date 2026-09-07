jest.mock('../src/repositories/announcement.repository', () => ({
  create: jest.fn(),
  list: jest.fn(),
  findById: jest.fn(),
  setPinned: jest.fn(),
  remove: jest.fn(),
}));
jest.mock('../src/repositories/auditLog.repository', () => ({
  log: jest.fn(),
}));

const announcementRepository = require('../src/repositories/announcement.repository');
const auditLogRepository = require('../src/repositories/auditLog.repository');
const announcementService = require('../src/services/announcement.service');

function makeAnnouncement(overrides = {}) {
  return {
    id: 1,
    referenceNo: 'AU/CEGOV/2026/001',
    title: 'Exam Notice',
    message: 'Exams start Monday',
    category: 'EXAM',
    priority: 'HIGH',
    targetRole: 'STUDENT',
    issuedBy: { id: 9, fullName: 'Dr. Rao' },
    dateIssued: new Date(),
    isPinned: false,
    createdAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  auditLogRepository.log.mockResolvedValue({});
});

describe('createAnnouncement', () => {
  test('creates and formats issuedBy from the joined user, falling back when none', async () => {
    announcementRepository.create.mockResolvedValue(makeAnnouncement());

    const result = await announcementService.createAnnouncement({ title: 'Exam Notice' }, 9);

    expect(result.issuedBy).toBe('Dr. Rao');
    expect(auditLogRepository.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ANNOUNCEMENT_CREATED', actorId: 9 })
    );
  });

  test('falls back to a default issuedBy string when no user is attached', async () => {
    announcementRepository.create.mockResolvedValue(makeAnnouncement({ issuedBy: null }));
    const result = await announcementService.createAnnouncement({ title: 'x' }, 9);
    expect(result.issuedBy).toBe('CeGov Portal Controller');
  });
});

describe('togglePin', () => {
  test('throws 404 for an unknown announcement', async () => {
    announcementRepository.findById.mockResolvedValue(null);
    await expect(announcementService.togglePin(999, true, 1)).rejects.toMatchObject({ statusCode: 404 });
  });

  test('pins and logs a distinct audit action from unpin', async () => {
    announcementRepository.findById.mockResolvedValue(makeAnnouncement());
    announcementRepository.setPinned.mockResolvedValue(makeAnnouncement({ isPinned: true }));

    const result = await announcementService.togglePin(1, true, 5);
    expect(result.isPinned).toBe(true);
    expect(auditLogRepository.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'ANNOUNCEMENT_PINNED' }));
  });

  test('unpins and logs the unpin action', async () => {
    announcementRepository.findById.mockResolvedValue(makeAnnouncement({ isPinned: true }));
    announcementRepository.setPinned.mockResolvedValue(makeAnnouncement({ isPinned: false }));

    await announcementService.togglePin(1, false, 5);
    expect(auditLogRepository.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'ANNOUNCEMENT_UNPINNED' }));
  });
});

describe('deleteAnnouncement', () => {
  test('throws 404 for an unknown announcement', async () => {
    announcementRepository.findById.mockResolvedValue(null);
    await expect(announcementService.deleteAnnouncement(999, 1)).rejects.toMatchObject({ statusCode: 404 });
    expect(announcementRepository.remove).not.toHaveBeenCalled();
  });

  test('deletes and logs the action', async () => {
    announcementRepository.findById.mockResolvedValue(makeAnnouncement());
    await announcementService.deleteAnnouncement(1, 5);
    expect(announcementRepository.remove).toHaveBeenCalledWith(1);
  });
});

describe('listAnnouncements', () => {
  test('paginates and formats results', async () => {
    announcementRepository.list.mockResolvedValue([[makeAnnouncement()], 1]);
    const result = await announcementService.listAnnouncements({ page: 1, limit: 20 });
    expect(result.announcements).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
  });
});
