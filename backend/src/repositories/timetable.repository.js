const prisma = require('../config/database');

function create(data) {
  return prisma.timetable.create({ data });
}

function findById(id) {
  return prisma.timetable.findUnique({ where: { id } });
}

function list({ departmentId, facultyId, dayOfWeek }) {
  return prisma.timetable.findMany({
    where: {
      ...(departmentId && { departmentId }),
      ...(facultyId && { facultyId }),
      ...(dayOfWeek && { dayOfWeek }),
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    include: { subject: true, faculty: { select: { fullName: true } } },
  });
}

function update(id, data) {
  return prisma.timetable.update({ where: { id }, data });
}

function remove(id) {
  return prisma.timetable.delete({ where: { id } });
}

// Finds the timetable slot (if any) covering `now` for this department, used
// by the attendance session engine to auto-open a CLASS session.
async function findSlotCoveringNow(departmentId, dayOfWeek, timeOfDay) {
  const slot = await prisma.timetable.findFirst({
    where: {
      departmentId,
      dayOfWeek,
      startTime: { lte: timeOfDay },
      endTime: { gte: timeOfDay },
    },
  });

  if (!slot) return null;

  // Enforce 10-minute machine activation window
  const startMs = slot.startTime.getTime();
  const timeMs = timeOfDay.getTime();
  const windowMs = 10 * 60 * 1000;
  
  if (timeMs > startMs + windowMs) {
    return null; // Past 10 minutes, machine deactivated
  }
  return slot;
}

module.exports = { create, findById, list, update, remove, findSlotCoveringNow };
