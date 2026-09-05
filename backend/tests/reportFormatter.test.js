const { PassThrough } = require('stream');
const ExcelJS = require('exceljs');
const { streamDepartmentPdf, streamDepartmentExcel } = require('../src/services/reportFormatter');

function collectStream(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

const summary = {
  departmentId: 1,
  from: new Date('2026-07-01'),
  to: new Date('2026-07-31'),
  departmentAveragePercentage: 82.5,
  users: [
    { userId: 1, fullName: 'Alice Student', role: 'STUDENT', attendedSessions: 18, totalSessions: 20, percentage: 90 },
    { userId: 2, fullName: 'Bob Student', role: 'STUDENT', attendedSessions: 15, totalSessions: 20, percentage: 75 },
    { userId: 3, fullName: 'New Student', role: 'STUDENT', attendedSessions: 0, totalSessions: 0, percentage: null },
  ],
};

describe('streamDepartmentPdf', () => {
  test('produces a real, valid PDF (correct magic bytes, non-trivial size)', async () => {
    const stream = new PassThrough();
    streamDepartmentPdf(stream, summary);
    const buffer = await collectStream(stream);

    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(500);
  });
});

describe('streamDepartmentExcel', () => {
  test('produces a real workbook that reads back with the exact data written', async () => {
    const stream = new PassThrough();
    const writePromise = streamDepartmentExcel(stream, summary);
    const bufferPromise = collectStream(stream);
    await writePromise;
    const buffer = await bufferPromise;

    // xlsx files are zip archives — "PK" magic bytes confirm it's real, not a stub
    expect(buffer.subarray(0, 2).toString()).toBe('PK');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet('Attendance');

    expect(sheet.getRow(1).values.slice(1)).toEqual([
      'User ID', 'Name', 'Role', 'Attended', 'Total', 'Percentage',
    ]);
    expect(sheet.getRow(2).values.slice(1)).toEqual([1, 'Alice Student', 'STUDENT', 18, 20, 90]);
    expect(sheet.getRow(4).values.slice(1)).toEqual([3, 'New Student', 'STUDENT', 0, 0, 'N/A']);
  });
});
