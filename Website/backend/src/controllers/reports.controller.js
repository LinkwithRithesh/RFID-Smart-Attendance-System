const analyticsService = require('../services/analytics.service');
const { streamDepartmentPdf, streamDepartmentExcel } = require('../services/reportFormatter');

async function departmentReport(req, res, next) {
  try {
    const { departmentId } = req.params;
    const from = new Date(req.query.from);
    const to = new Date(req.query.to);
    const { format, role } = req.query;

    const summary = await analyticsService.getDepartmentSummary(departmentId, from, to, role);
    const filenameDate = `${from.toISOString().slice(0, 10)}_to_${to.toISOString().slice(0, 10)}`;

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="department_${departmentId}_${filenameDate}.pdf"`);
      streamDepartmentPdf(res, summary);
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="department_${departmentId}_${filenameDate}.xlsx"`);
      await streamDepartmentExcel(res, summary);
    }
  } catch (err) {
    next(err);
  }
}

const prisma = require('../config/database');
const { calculateAttendanceMetrics } = require('../services/attendanceAnalytics.service');
const { success } = require('../utils/apiResponse');

async function getStudentStatement(req, res, next) {
  try {
    const studentId = req.query.studentId ? Number(req.query.studentId) : req.user?.id;
    const { semester, academicYear } = req.query;

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        department: true,
        studentProfile: { include: { course: true } },
      },
    });

    const subjects = await prisma.subject.findMany({
      include: {
        faculty: true,
        attendanceSessions: {
          include: {
            attendances: {
              where: { userId: studentId },
            },
          },
        },
      },
    });

    let totalHeld = 0;
    let totalAttended = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalOd = 0;

    const subjectBreakdown = subjects.map((sub) => {
      const records = sub.attendanceSessions.flatMap((s) => s.attendances);
      const metrics = calculateAttendanceMetrics(records);
      totalHeld += metrics.held;
      totalAttended += metrics.attended;
      totalAbsent += metrics.absent;
      totalLate += metrics.late;
      totalOd += metrics.od;

      return {
        code: sub.code,
        name: sub.name,
        faculty: sub.faculty?.fullName || 'Assigned Faculty',
        credits: sub.credits,
        ...metrics,
      };
    });

    const overallPercentage = totalHeld === 0 ? 100 : Number(((totalAttended / totalHeld) * 100).toFixed(1));

    const statement = {
      institution: 'SmartAttend University Institute of Technology',
      generatedAt: new Date().toISOString(),
      student: {
        id: student?.id || studentId,
        name: student?.fullName || 'Student',
        rollNo: student?.studentProfile?.rollNumber || student?.email?.split('@')[0] || String(studentId),
        department: student?.department?.name || 'Department of Computer Science & Engineering',
        program: student?.studentProfile?.course?.name || 'B.Tech Information Technology',
        semester: semester || 'VI Semester',
        academicYear: academicYear || '2025 - 2026',
      },
      summary: {
        totalHeld,
        totalAttended,
        totalAbsent,
        totalLate,
        totalOd,
        overallPercentage,
        status: overallPercentage >= 75 ? 'ELIGIBLE' : 'CONDONATION_REQUIRED',
      },
      subjects: subjectBreakdown,
    };

    return success(res, 200, 'Student statement generated', statement);
  } catch (err) {
    next(err);
  }
}

async function exportStudentStatement(req, res, next) {
  try {
    const studentId = req.query.studentId ? Number(req.query.studentId) : req.user?.id;
    const format = req.query.format === 'pdf' ? 'pdf' : 'csv';

    const subjects = await prisma.subject.findMany({
      include: {
        faculty: true,
        attendanceSessions: {
          include: {
            attendances: {
              where: { userId: studentId },
            },
          },
        },
      },
    });

    const rows = subjects.map((sub) => {
      const records = sub.attendanceSessions.flatMap((s) => s.attendances);
      const metrics = calculateAttendanceMetrics(records);
      return {
        code: sub.code,
        name: sub.name,
        faculty: sub.faculty?.fullName || 'N/A',
        credits: sub.credits,
        held: metrics.held,
        attended: metrics.attended,
        absent: metrics.absent,
        late: metrics.late,
        od: metrics.od,
        percentage: `${metrics.percentage}%`,
        eligibility: metrics.percentage >= 75 ? 'Eligible' : 'Shortage',
      };
    });

    const filename = `attendance_statement_student_${studentId}_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);

      const headers = 'Subject Code,Subject Name,Faculty,Credits,Held,Attended,Absent,Late,OD,Percentage,Eligibility\n';
      const csvData = rows
        .map(
          (r) =>
            `"${r.code}","${r.name}","${r.faculty}",${r.credits},${r.held},${r.attended},${r.absent},${r.late},${r.od},"${r.percentage}","${r.eligibility}"`
        )
        .join('\n');
      return res.status(200).send(headers + csvData);
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 40 });
      doc.pipe(res);

      doc.fontSize(16).text('Official Attendance Statement', { align: 'center' });
      doc.fontSize(10).text('SmartAttend Academic Administration', { align: 'center' });
      doc.moveDown();
      doc.text(`Student ID: ${studentId}`);
      doc.text(`Date of Generation: ${new Date().toLocaleDateString()}`);
      doc.moveDown();

      rows.forEach((r) => {
        doc.fontSize(9).text(`${r.code} - ${r.name}: ${r.attended}/${r.held} (${r.percentage}) [${r.eligibility}]`);
      });

      doc.end();
    }
  } catch (err) {
    next(err);
  }
}

module.exports = { departmentReport, getStudentStatement, exportStudentStatement };

