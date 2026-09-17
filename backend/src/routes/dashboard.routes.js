const express = require('express');
const authenticate = require('../middleware/authenticate');
const { success } = require('../utils/apiResponse');
const prisma = require('../config/database');
const { getEffectiveRole } = require('../utils/roleMapper');

const router = express.Router();
router.use(authenticate);

router.get('/stats', async (req, res, next) => {
  try {
    const studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
    const facultyRole = await prisma.role.findUnique({ where: { name: 'FACULTY' } });
    const totalStudents = studentRole ? await prisma.user.count({ where: { roleId: studentRole.id } }) : 0;
    const totalFaculty = facultyRole ? await prisma.user.count({ where: { roleId: facultyRole.id } }) : 0;
    const allActiveDevices = await prisma.device.findMany({ where: { status: { not: 'DECOMMISSIONED' } } });
    const totalDevices = allActiveDevices.length;
    const { computeIsOnline } = require('../utils/deviceOnlineStatus');
    const onlineDevices = allActiveDevices.filter(d => computeIsOnline(d)).length;
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const todaySessions = await prisma.attendanceSession.findMany({ where: { sessionDate: { gte: today, lt: tomorrow } }, select: { id: true } });
    const sessionIds = todaySessions.map(s => s.id);
    let todayTurnout = 0;
    if (sessionIds.length > 0) {
      const totalMarked = await prisma.attendance.count({ where: { sessionId: { in: sessionIds } } });
      const totalPresent = await prisma.attendance.count({ where: { sessionId: { in: sessionIds }, status: { in: ['PRESENT', 'LATE'] } } });
      todayTurnout = totalMarked > 0 ? Number(((totalPresent / totalMarked) * 100).toFixed(1)) : 0;
    }
    const announcementsCount = await prisma.announcement.count();
    const unreadNotifications = await prisma.notification.count({ where: { userId: req.user.id, readAt: null } });
    const odRequestsCount = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });
    const openHelpdeskCount = await prisma.helpDeskTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } });
    return success(res, 200, 'Admin stats retrieved', {
      students: totalStudents, faculty: totalFaculty, devices: totalDevices, onlineDevices, todayAttendance: todayTurnout, announcementsCount, unreadNotifications, odRequestsCount, openHelpdeskCount
    });
  } catch (err) { next(err); }
});

router.get('/student/stats', async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const totalMarked = await prisma.attendance.count({ where: { userId: studentId } });
    const totalPresent = await prisma.attendance.count({ where: { userId: studentId, status: { in: ['PRESENT', 'LATE'] } } });
    const totalAbsent = await prisma.attendance.count({ where: { userId: studentId, status: 'ABSENT' } });
    const held = totalMarked || 0;
    const attended = totalPresent || 0;
    const absent = totalAbsent || 0;
    const percentage = held > 0 ? Number(((attended / held) * 100).toFixed(1)) : 0;
    const safeMisses = Math.max(0, Math.floor((attended - 0.75 * held) / 0.75));
    const requiredTo75 = percentage < 75 ? Math.ceil((0.75 * held - attended) / 0.25) : 0;
    return success(res, 200, 'Student overall stats retrieved', {
      totalHeld: held, totalAttended: attended, totalAbsent: absent, overallPercentage: percentage, maxAllowedMisses: safeMisses, classesNeededFor75: requiredTo75, attendanceStreak: 0
    });
  } catch (err) { next(err); }
});

router.get('/student/today', async (req, res, next) => {
  try {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const todayDay = days[new Date().getDay()];
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return success(res, 200, 'Today schedule retrieved', []);
    const slots = await prisma.timetable.findMany({
      where: { semester: profile.currentSemester, dayOfWeek: todayDay },
      include: { subject: true, faculty: { select: { fullName: true } } },
      orderBy: { startTime: 'asc' }
    });
    const formatted = slots.map(s => ({
      id: s.id, code: s.subject?.code || 'EC3401', subject: s.subject?.name || 'Subject', faculty: s.faculty?.fullName || 'Faculty Staff', room: s.roomNumber || 'Room 302', time: s.startTime.toISOString().slice(11,16) + ' - ' + s.endTime.toISOString().slice(11,16), method: 'RFID Turnstile', status: 'UPCOMING'
    }));
    return success(res, 200, 'Today schedule retrieved', formatted);
  } catch (err) { next(err); }
});

router.get('/student/trend', async (req, res, next) => {
  try {
    const trend = [
      { week: 'Wk 1', attendance: 0 }, { week: 'Wk 2', attendance: 0 }, { week: 'Wk 3', attendance: 0 }, { week: 'Wk 4', attendance: 0 }, { week: 'Wk 5', attendance: 0 }, { week: 'Wk 6', attendance: 0 }
    ];
    return success(res, 200, 'Attendance trend retrieved', trend);
  } catch (err) { next(err); }
});

router.get('/faculty/courses', async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({ where: { facultyId: req.user.id }, include: { course: true } });
    const data = await Promise.all(subjects.map(async (sub) => {
      const totalSessions = await prisma.attendanceSession.count({ where: { subjectId: sub.id } });
      const totalMarked = await prisma.attendance.count({ where: { session: { subjectId: sub.id } } });
      const totalPresent = await prisma.attendance.count({ where: { session: { subjectId: sub.id }, status: { in: ['PRESENT', 'LATE'] } } });
      const pct = totalMarked > 0 ? Number(((totalPresent / totalMarked) * 100).toFixed(1)) : 0;
      return { id: sub.id, code: sub.code, name: sub.name, semester: sub.semester, attendanceRate: pct, enrolledCount: 0, totalSessions };
    }));
    return success(res, 200, 'Faculty courses retrieved', data);
  } catch (err) { next(err); }
});


router.get('/faculty/today', async (req, res, next) => {
  try {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const todayDay = days[new Date().getDay()];
    
    // Get today's timetable for this faculty
    const slots = await prisma.timetable.findMany({
      where: { facultyId: req.user.id, dayOfWeek: todayDay },
      include: { subject: true },
      orderBy: { startTime: 'asc' }
    });

    const formatted = slots.map(s => ({
      id: s.id,
      code: s.subject?.code || 'SUB',
      subject: s.subject?.name || 'Subject',
      room: s.roomNumber || 'Classroom',
      time: s.startTime.toISOString().slice(11,16) + ' - ' + s.endTime.toISOString().slice(11,16),
      period: 'P',
      semester: s.semester
    }));

    // See if there's an active live session right now for this faculty
    const activeSession = await prisma.attendanceSession.findFirst({
      where: { facultyId: req.user.id, status: 'OPEN' },
      include: { subject: true }
    });
    
    let activeClass = null;
    if (activeSession) {
      activeClass = {
        id: activeSession.id,
        code: activeSession.subject?.code || 'SUB',
        subject: activeSession.subject?.name || 'Subject',
        room: activeSession.room || 'Classroom',
        enrolled: 60, // Mock for now
        present: 0,
        absent: 0
      };
      
      const totalMarked = await prisma.attendance.count({ where: { sessionId: activeSession.id } });
      const totalPresent = await prisma.attendance.count({ where: { sessionId: activeSession.id, status: { in: ['PRESENT', 'LATE'] } } });
      activeClass.present = totalPresent;
      activeClass.absent = totalMarked - totalPresent;
    }

    return success(res, 200, 'Faculty today data', { timetable: formatted, activeClass });
  } catch (err) { next(err); }
});


router.get('/faculty/subject/:subjectId/students', async (req, res, next) => {
  try {
    const subjectId = Number(req.params.subjectId);
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return success(res, 404, 'Subject not found', []);

    // Get all students matching course and semester
    const students = await prisma.user.findMany({
      where: {
        role: { name: 'STUDENT' },
        studentProfile: {
          courseId: subject.courseId,
          currentSemester: subject.semester
        }
      },
      include: {
        studentProfile: true
      },
      orderBy: { fullName: 'asc' }
    });

    const formatted = students.map(s => ({
      id: s.id,
      name: s.fullName,
      email: s.email,
      rollNumber: s.studentProfile?.rollNumber || 'N/A',
      enrollmentNumber: s.studentProfile?.enrollmentNumber || 'N/A',
      phone: s.phone || 'N/A'
    }));

    return success(res, 200, 'Enrolled students retrieved', formatted);
  } catch (err) { next(err); }
});

router.get('/faculty/subject/:subjectId/sessions', async (req, res, next) => {
  try {
    const subjectId = Number(req.params.subjectId);
    const sessions = await prisma.attendanceSession.findMany({
      where: { subjectId: subjectId },
      orderBy: { sessionDate: 'desc' }
    });

    const formatted = await Promise.all(sessions.map(async (s) => {
      const totalMarked = await prisma.attendance.count({ where: { sessionId: s.id } });
      const totalPresent = await prisma.attendance.count({ where: { sessionId: s.id, status: { in: ['PRESENT', 'LATE'] } } });
      return {
        id: s.id,
        date: s.sessionDate.toISOString().split('T')[0],
        type: s.type,
        status: s.status,
        totalMarked,
        present: totalPresent,
        absent: totalMarked - totalPresent
      };
    }));

    return success(res, 200, 'Subject sessions retrieved', formatted);
  } catch (err) { next(err); }
});

module.exports = router;

