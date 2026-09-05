process.env.JWT_ACCESS_SECRET = 'test_access_secret';

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

const fs = require('fs');
const path = require('path');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const documentRepository = require('../src/repositories/document.repository');
const documentRoutes = require('../src/routes/document.routes');
const { errorHandler } = require('../src/middleware/errorHandler');
const { UPLOAD_DIR } = require('../src/config/upload');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/documents', documentRoutes);
  app.use(errorHandler);
  return app;
}

function adminToken() {
  return jwt.sign({ sub: 1, roleId: 1, role: 'ADMINISTRATOR' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

describe('document upload (real Multer, real disk write)', () => {
  const app = buildApp();
  let uploadedFilePath;

  beforeEach(() => jest.clearAllMocks());

  afterEach(() => {
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
  });

  test('rejects an unsupported file type before it ever reaches the service', async () => {
    documentRepository.create.mockResolvedValue({});

    const res = await request(app)
      .post('/documents')
      .set('Authorization', `Bearer ${adminToken()}`)
      .field('title', 'Malware')
      .field('code', 'X-01')
      .field('category', 'GUIDELINES')
      .field('description', 'x')
      .attach('file', Buffer.from('not a real exe'), { filename: 'virus.exe', contentType: 'application/x-msdownload' });

    expect(res.status).toBe(500); // multer fileFilter error surfaces as a generic error
    expect(documentRepository.create).not.toHaveBeenCalled();
  });

  test('accepts a real PDF, writes it to disk, and the service receives the real path/size', async () => {
    const pdfContent = Buffer.from('%PDF-1.4 fake but valid-looking content for the test');
    documentRepository.create.mockImplementation(async (data) => {
      uploadedFilePath = data.filePath;
      return {
        id: 1,
        ...data,
        downloadsCount: 0,
        updatedAt: new Date(),
      };
    });

    const res = await request(app)
      .post('/documents')
      .set('Authorization', `Bearer ${adminToken()}`)
      .field('title', 'Bonafide Certificate')
      .field('code', 'FORM-AU-01')
      .field('category', 'CERTIFICATE')
      .field('description', 'Standard bonafide certificate form')
      .attach('file', pdfContent, { filename: 'form.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
    expect(documentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Bonafide Certificate',
        code: 'FORM-AU-01',
        fileSizeBytes: pdfContent.length,
        filePath: expect.stringContaining(UPLOAD_DIR),
      })
    );

    // The real, physical proof: the file actually exists on disk with the exact content sent.
    expect(fs.existsSync(uploadedFilePath)).toBe(true);
    expect(fs.readFileSync(uploadedFilePath)).toEqual(pdfContent);
  });

  test('rejects upload from a role not in the allow-list', async () => {
    const studentToken = jwt.sign({ sub: 2, roleId: 2, role: 'STUDENT' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    const res = await request(app)
      .post('/documents')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('title', 'x')
      .field('code', 'x')
      .field('category', 'CERTIFICATE')
      .field('description', 'x')
      .attach('file', Buffer.from('%PDF-'), { filename: 'x.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(403);
  });
});
