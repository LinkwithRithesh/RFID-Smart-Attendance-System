const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const subjectMap = {
  'A': { subjectId: 9, facultyId: 15 },
  'B': { subjectId: 5, facultyId: 11 },
  'C': { subjectId: 8, facultyId: 14 },
  'D': { subjectId: 6, facultyId: 12 },
  'E': { subjectId: 7, facultyId: 13 },
  'F': { subjectId: 11, facultyId: 16 },
  'G': { subjectId: 10, facultyId: 12 },
  'F-Lab': { subjectId: 11, facultyId: 16 },
  'CE-Lab': { subjectId: 7, facultyId: 13 }, // Analog lab
  'G-Lab': { subjectId: 10, facultyId: 12 },
  'Audit': { subjectId: 13, facultyId: 11 }
};

const periods = {
  1: { start: "08:30:00", end: "09:20:00" },
  2: { start: "09:25:00", end: "10:15:00" },
  3: { start: "10:30:00", end: "11:20:00" },
  4: { start: "11:25:00", end: "12:15:00" },
  5: { start: "13:10:00", end: "14:00:00" },
  6: { start: "14:05:00", end: "14:55:00" },
  7: { start: "15:00:00", end: "15:50:00" },
  8: { start: "15:55:00", end: "16:45:00" }
};

const schedule = [
  // Monday
  { day: 'MON', p: 1, s: 'C' },
  { day: 'MON', p: 2, s: 'C' },
  { day: 'MON', p: 3, s: 'E' },
  { day: 'MON', p: 4, s: 'F' },
  { day: 'MON', p: 5, s: 'G' },
  // Tuesday
  { day: 'TUE', p: 1, s: 'A' },
  { day: 'TUE', p: 2, s: 'A' },
  { day: 'TUE', p: 3, s: 'E' },
  { day: 'TUE', p: 4, s: 'E' },
  { day: 'TUE', p: 5, s: 'B' },
  // Wednesday
  { day: 'WED', p: 1, s: 'A' },
  { day: 'WED', p: 2, s: 'A' },
  { day: 'WED', p: 3, s: 'C' },
  { day: 'WED', p: 4, s: 'D' },
  { day: 'WED', p: 5, s: 'F-Lab' },
  { day: 'WED', p: 6, s: 'F-Lab' },
  { day: 'WED', p: 7, s: 'F-Lab' },
  // Thursday
  { day: 'THU', p: 1, s: 'B' },
  { day: 'THU', p: 2, s: 'B' },
  { day: 'THU', p: 5, s: 'CE-Lab' },
  { day: 'THU', p: 6, s: 'CE-Lab' },
  { day: 'THU', p: 7, s: 'CE-Lab' },
  // Friday
  { day: 'FRI', p: 1, s: 'D' },
  { day: 'FRI', p: 2, s: 'D' },
  { day: 'FRI', p: 5, s: 'G-Lab' },
  { day: 'FRI', p: 6, s: 'G-Lab' },
  { day: 'FRI', p: 7, s: 'G-Lab' },
  { day: 'FRI', p: 8, s: 'Audit' }, // 8 & 9, we'll put in 8
];

function timeToDate(timeStr) {
  const [h, m, s] = timeStr.split(':');
  return new Date(Date.UTC(1970, 0, 1, parseInt(h), parseInt(m), parseInt(s)));
}

async function run() {
  await prisma.timetable.deleteMany({});
  console.log('Cleared existing timetable');

  const data = schedule.map(entry => {
    const subj = subjectMap[entry.s];
    const period = periods[entry.p];
    return {
      subjectId: subj.subjectId,
      facultyId: subj.facultyId,
      departmentId: 1,
      roomNumber: 'KP 104',
      dayOfWeek: entry.day,
      startTime: timeToDate(period.start),
      endTime: timeToDate(period.end),
      semester: 3,
      academicYear: '2026-2027'
    };
  });

  await prisma.timetable.createMany({ data });
  console.log('Inserted new timetable');
}

run().catch(console.error).finally(() => prisma.$disconnect());
