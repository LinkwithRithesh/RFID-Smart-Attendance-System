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
function findSlotCoveringNow(departmentId, dayOfWeek, timeOfDay) {
  return prisma.timetable.findFirst({
    where: {
      departmentId,
      dayOfWeek,
      startTime: { lte: timeOfDay },
      endTime: { gte: timeOfDay },
    },
  });
}

module.exports = { create, findById, list, update, remove, findSlotCoveringNow };
