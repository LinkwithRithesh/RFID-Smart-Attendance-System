jest.mock('../src/repositories/document.repository', () => ({
  create: jest.fn(),
  list: jest.fn(),
  findById: jest.fn(),
  incrementDownloads: jest.fn(),
  remove: jest.fn(),
}));
jest.mock('../src/repositories/auditLog.repository', () => ({
  log: jest.fn(),
}));
jest.mock('fs');

const fs = require('fs');
const documentRepository = require('../src/repositories/document.repository');
const auditLogRepository = require('../src/repositories/auditLog.repository');
const documentService = require('../src/services/document.service');

function makeDoc(overrides = {}) {
  return {
    id: 1,
    title: 'Bonafide Certificate',
    code: 'FORM-AU-01',
    category: 'CERTIFICATE',
    description: 'x',
    filePath: '/uploads/documents/123-abc.pdf',
    fileSizeBytes: 245760,
    downloadsCount: 5,
    updatedAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  auditLogRepository.log.mockResolvedValue({});
});

describe('formatFileSize', () => {
  test('formats bytes, KB, and MB correctly', () => {
    expect(documentService.formatFileSize(500)).toBe('500 B');
    expect(documentService.formatFileSize(245760)).toBe('240 KB');
    expect(documentService.formatFileSize(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});

describe('uploadDocument', () => {
  test('stores the real file path/size from Multer and logs the upload', async () => {
    documentRepository.create.mockResolvedValue(makeDoc());

    const result = await documentService.uploadDocument(
      { title: 'Bonafide Certificate', code: 'FORM-AU-01', category: 'CERTIFICATE', description: 'x' },
      { path: '/uploads/documents/123-abc.pdf', size: 245760 },
      9
    );

    expect(documentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ filePath: '/uploads/documents/123-abc.pdf', fileSizeBytes: 245760, uploadedById: 9 })
    );
    expect(result.fileSize).toBe('240 KB');
    expect(auditLogRepository.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'DOCUMENT_UPLOADED' }));
  });
});

describe('getDownload', () => {
  test('throws 404 for an unknown document', async () => {
    documentRepository.findById.mockResolvedValue(null);
    await expect(documentService.getDownload(999)).rejects.toMatchObject({ statusCode: 404 });
  });

  test('throws 404 when the DB record exists but the file is missing on disk', async () => {
    documentRepository.findById.mockResolvedValue(makeDoc());
    fs.existsSync.mockReturnValue(false);
    await expect(documentService.getDownload(1)).rejects.toMatchObject({ statusCode: 404 });
    expect(documentRepository.incrementDownloads).not.toHaveBeenCalled();
  });

  test('increments the download counter when the file exists', async () => {
    documentRepository.findById.mockResolvedValue(makeDoc());
    fs.existsSync.mockReturnValue(true);

    const result = await documentService.getDownload(1);
    expect(documentRepository.incrementDownloads).toHaveBeenCalledWith(1);
    expect(result.fileName).toBe('FORM-AU-01.pdf');
  });
});

describe('deleteDocument', () => {
  test('throws 404 for an unknown document', async () => {
    documentRepository.findById.mockResolvedValue(null);
    await expect(documentService.deleteDocument(999, 1)).rejects.toMatchObject({ statusCode: 404 });
  });

  test('removes the DB record and attempts best-effort file cleanup', async () => {
    documentRepository.findById.mockResolvedValue(makeDoc());
    fs.unlink.mockImplementation((p, cb) => cb(null));

    await documentService.deleteDocument(1, 9);

    expect(documentRepository.remove).toHaveBeenCalledWith(1);
    expect(fs.unlink).toHaveBeenCalled();
    expect(auditLogRepository.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'DOCUMENT_DELETED' }));
  });
});
