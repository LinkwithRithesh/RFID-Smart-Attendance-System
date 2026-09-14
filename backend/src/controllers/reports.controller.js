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
    let studentId = req.user?.id;
    if (req.query.studentId && !isNaN(req.query.studentId)) {
      studentId = Number(req.query.studentId);
    } else if (req.query.studentId && isNaN(req.query.studentId)) {
      const student = await prisma.user.findFirst({
        where: {
          OR: [
            { loginId: req.query.studentId },
            { email: req.query.studentId },
            { studentProfile: { rollNumber: req.query.studentId } }
          ]
        }
      });
      if (student) studentId = student.id;
    }

    const studentInfo = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        department: true,
        studentProfile: { include: { course: true } }
      }
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
    
    const rows = subjects.map((sub, index) => {
      const records = sub.attendanceSessions.flatMap((s) => s.attendances);
      const metrics = calculateAttendanceMetrics(records);
      totalHeld += metrics.held;
      totalAttended += metrics.attended;
      
      return {
        slNo: index + 1,
        code: sub.code,
        name: sub.name,
        faculty: sub.faculty?.fullName || 'N/A',
        credits: sub.credits,
        held: metrics.held,
        attended: metrics.attended,
        absent: metrics.absent,
        late: metrics.late,
        od: metrics.od,
        percentage: metrics.percentage,
        eligibility: metrics.percentage >= 75 ? 'Eligible' : 'Shortage',
      };
    });

    const overallPercentage = totalHeld === 0 ? 100 : Number(((totalAttended / totalHeld) * 100).toFixed(2));

    const filename = `attendance_statement_student_${studentId}_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);

      const headers = 'Subject Code,Subject Name,Faculty,Credits,Held,Attended,Absent,Late,OD,Percentage,Eligibility\n';
      const csvData = rows
        .map(
          (r) =>
            `"${r.code}","${r.name}","${r.faculty}",${r.credits},${r.held},${r.attended},${r.absent},${r.late},${r.od},"${r.percentage}%","${r.eligibility}"`
        )
        .join('\n');
      return res.status(200).send(headers + csvData);
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      doc.pipe(res);

      // Header
      doc.font('Helvetica-Bold').fontSize(14).text('ANNA UNIVERSITY, CHENNAI 600 025', { align: 'center' });
      doc.fontSize(12).text('University Departments', { align: 'center' });
      doc.fontSize(12).text("2026-27 ODD SEM - Student's Attendance Report", { align: 'center' });
      doc.moveDown(1.5);

      const rollNo = studentInfo?.studentProfile?.rollNumber || studentInfo?.loginId || String(studentId);
      const degreeBranch = `B.E. - ${studentInfo?.studentProfile?.course?.name || 'Electronics and Communication Engineering'}`;
      const dept = studentInfo?.department?.name || 'Electronics and Communication Engineering';
      const semester = studentInfo?.studentProfile?.currentSemester ? `${studentInfo.studentProfile.currentSemester} - Semester` : 'XI - Semester';
      
      const leftCol = 50;
      const rightCol = 180;
      
      doc.font('Helvetica').fontSize(11);
      doc.text('Register Number', leftCol, doc.y);
      doc.text(`:  ${rollNo}`, rightCol, doc.y - 11);
      doc.moveDown(0.5);
      
      doc.text('Degree & Branch', leftCol, doc.y);
      doc.text(`:  ${degreeBranch}`, rightCol, doc.y - 11);
      doc.moveDown(0.5);
      
      doc.text('Department', leftCol, doc.y);
      doc.text(`:  ${dept}`, rightCol, doc.y - 11);
      doc.moveDown(0.5);
      
      doc.text('Semester', leftCol, doc.y);
      doc.text(`:  ${semester}`, rightCol, doc.y - 11);
      doc.moveDown(2);

      // Table Header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold').fontSize(10);
      
      const colSl = 50;
      const colCode = 90;
      const colTitle = 180;
      const colAtt = 450;
      
      doc.rect(40, tableTop, 515, 20).stroke();
      doc.text('Sl.No', colSl, tableTop + 5);
      doc.text('Course Code', colCode, tableTop + 5);
      doc.text('Course Title', colTitle, tableTop + 5);
      doc.text('Attendance\n%', colAtt, tableTop + 2, { align: 'center', width: 105 });
      
      // Vertical lines for header
      doc.moveTo(85, tableTop).lineTo(85, tableTop + 20).stroke();
      doc.moveTo(175, tableTop).lineTo(175, tableTop + 20).stroke();
      doc.moveTo(450, tableTop).lineTo(450, tableTop + 20).stroke();

      let rowY = tableTop + 20;
      
      doc.font('Helvetica').fontSize(9);
      rows.forEach((r) => {
        doc.rect(40, rowY, 515, 20).stroke();
        doc.text(String(r.slNo), colSl, rowY + 5, { width: 35, align: 'center' });
        doc.text(r.code, colCode, rowY + 5);
        doc.text(r.name, colTitle, rowY + 5);
        doc.text(Number(r.percentage).toFixed(2), colAtt, rowY + 5, { align: 'center', width: 105 });
        
        doc.moveTo(85, rowY).lineTo(85, rowY + 20).stroke();
        doc.moveTo(175, rowY).lineTo(175, rowY + 20).stroke();
        doc.moveTo(450, rowY).lineTo(450, rowY + 20).stroke();
        
        rowY += 20;
      });

      // Footer Row for Overall Percentage
      doc.rect(40, rowY, 515, 20).stroke();
      doc.font('Helvetica-Bold');
      doc.text('Overall Percentage', 180, rowY + 5, { width: 260, align: 'right' });
      doc.text(overallPercentage.toFixed(2), colAtt, rowY + 5, { align: 'center', width: 105 });
      doc.moveTo(450, rowY).lineTo(450, rowY + 20).stroke();
      
      doc.moveDown(5);
      const sigY = doc.y;
      
      doc.font('Helvetica').fontSize(11);
      doc.text('Faculty Advisor', 50, sigY);
      doc.text('Office Seal', 250, sigY);
      doc.text('Head of Department', 400, sigY);
      
      // Footer text at the bottom
      doc.fontSize(8);
      const generatedAt = new Date().toLocaleString();
      doc.text(`Generated through CeGov Web Portal  ${generatedAt}`, 40, doc.page.height - 50);

      doc.end();
    }
  } catch (err) {
    next(err);
  }
}

module.exports = { departmentReport, getStudentStatement, exportStudentStatement };

