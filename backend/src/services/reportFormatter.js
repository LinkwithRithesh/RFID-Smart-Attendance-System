const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

/**
 * Streams a department attendance report as PDF directly onto the response.
 * Takes already-aggregated data (from analytics.service) — no DB access here,
 * which keeps this fully unit-testable independent of Prisma.
 */
function streamDepartmentPdf(res, summary) {
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(16).text('Department Attendance Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Department ID: ${summary.departmentId}`);
  doc.text(`Period: ${summary.from.toISOString().slice(0, 10)} to ${summary.to.toISOString().slice(0, 10)}`);
  doc.text(
    `Department average: ${summary.departmentAveragePercentage !== null ? `${summary.departmentAveragePercentage}%` : 'N/A'}`
  );
  doc.moveDown();

  doc.fontSize(11).text('Name', 40, doc.y, { continued: true, width: 200 });
  doc.text('Role', 240, doc.y, { continued: true, width: 120 });
  doc.text('Attended / Total', 360, doc.y, { continued: true, width: 100 });
  doc.text('%', 460);
  doc.moveDown(0.5);

  summary.users.forEach((u) => {
    doc.fontSize(10).text(u.fullName, 40, doc.y, { continued: true, width: 200 });
    doc.text(u.role, 240, doc.y, { continued: true, width: 120 });
    doc.text(`${u.attendedSessions} / ${u.totalSessions}`, 360, doc.y, { continued: true, width: 100 });
    doc.text(u.percentage !== null ? `${u.percentage}%` : 'N/A', 460);
  });

  doc.end();
}

/**
 * Writes a department attendance report as an Excel workbook directly onto
 * the response. Same aggregated-data-in, no-DB-access design as the PDF path.
 */
async function streamDepartmentExcel(res, summary) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Attendance');

  sheet.columns = [
    { header: 'User ID', key: 'userId', width: 10 },
    { header: 'Name', key: 'fullName', width: 30 },
    { header: 'Role', key: 'role', width: 18 },
    { header: 'Attended', key: 'attendedSessions', width: 12 },
    { header: 'Total', key: 'totalSessions', width: 10 },
    { header: 'Percentage', key: 'percentage', width: 12 },
  ];
  sheet.getRow(1).font = { bold: true };

  summary.users.forEach((u) => {
    sheet.addRow({
      userId: u.userId,
      fullName: u.fullName,
      role: u.role,
      attendedSessions: u.attendedSessions,
      totalSessions: u.totalSessions,
      percentage: u.percentage !== null ? u.percentage : 'N/A',
    });
  });

  await workbook.xlsx.write(res);
}

module.exports = { streamDepartmentPdf, streamDepartmentExcel };
