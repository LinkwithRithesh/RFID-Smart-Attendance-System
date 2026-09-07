const attendanceSessionService = require('../services/attendanceSession.service');
const { success } = require('../utils/apiResponse');
const eventBus = require('../utils/eventBus');

async function openManualSession(req, res, next) {
  try {
    const session = await attendanceSessionService.openManualSession(req.body, req.user);
    return success(res, 201, 'Attendance session opened', session);
  } catch (err) {
    next(err);
  }
}

async function closeSession(req, res, next) {
  try {
    const session = await attendanceSessionService.closeSessionManually(req.params.id, req.user);
    return success(res, 200, 'Attendance session closed', session);
  } catch (err) {
    next(err);
  }
}

async function streamSessionEvents(req, res) {
  const sessionId = req.params.id;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const channel = `session:${sessionId}`;
  const onEvent = (data) => {
    res.write(`event: attendance\ndata: ${JSON.stringify(data)}\n\n`);
  };

  eventBus.on(channel, onEvent);

  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    eventBus.removeListener(channel, onEvent);
  });
}

async function getSessionEvents(req, res, next) {
  try {
    const sessionId = Number(req.params.id);
    const since = req.query.since ? new Date(req.query.since) : new Date(0);
    const prisma = require('../config/database');
    const records = await prisma.attendance.findMany({
      where: {
        sessionId,
        markedAt: { gt: since },
      },
      include: {
        user: true,
      },
      orderBy: { markedAt: 'asc' },
    });

    const events = records.map((r) => ({
      id: String(r.id),
      studentId: r.userId,
      name: r.user.fullName,
      rollNo: r.user.email.split('@')[0],
      method: r.method,
      status: r.status,
      timestamp: r.markedAt.toISOString(),
      confidence: 99.4,
      deviceId: r.deviceId,
    }));

    return success(res, 200, 'Session events retrieved', { events });
  } catch (err) {
    next(err);
  }
}

async function getActiveSessions(req, res, next) {
  try {
    const prisma = require('../config/database');
    const sessions = await prisma.attendanceSession.findMany({
      where: { status: 'OPEN' },
      include: {
        department: true,
        subject: true,
        faculty: true,
        attendances: true,
      },
    });

    const active = sessions.map((s) => ({
      id: s.id,
      departmentId: s.departmentId,
      departmentName: s.department?.name,
      courseCode: s.subject?.code || 'GEN-101',
      courseName: s.subject?.name || 'Academic Lecture',
      facultyName: s.faculty?.fullName || 'Faculty Instructor',
      room: s.department?.code ? `Hall ${s.department.code}-101` : 'Room 302',
      presentCount: s.attendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length,
      totalEnrolled: 60,
      startTime: s.startTime,
      endTime: s.endTime,
      deviceStatus: 'ONLINE',
    }));

    return success(res, 200, 'Active attendance sessions retrieved', active);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  openManualSession,
  closeSession,
  streamSessionEvents,
  getSessionEvents,
  getActiveSessions,
};
