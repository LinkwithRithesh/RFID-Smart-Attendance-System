const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const subjectMap = {
  'B': { subjectId: 5, facultyId: 11 }, // EMF
  'F-Lab': { subjectId: 11, facultyId: 16 }, // Signal Processing
  'CE-Lab': { subjectId: 7, facultyId: 13 }, // Analog Lab
};

const periods = {
  3: { start: "10:30:00", end: "11:20:00" },
  8: { start: "15:55:00", end: "16:45:00" }
};

function timeToDate(timeStr) {
  const [h, m, s] = timeStr.split(':');
  return new Date(Date.UTC(1970, 0, 1, parseInt(h), parseInt(m), parseInt(s)));
}

async function run() {
  const newSlots = [
    // Thursday 3rd hour EMF (B)
    { day: 'THU', p: 3, s: 'B' },
    // Wednesday class till 4:45 (Period 8 -> F-Lab)
    { day: 'WED', p: 8, s: 'F-Lab' },
    // Thursday class till 4:45 (Period 8 -> CE-Lab)
    { day: 'THU', p: 8, s: 'CE-Lab' }
  ];

  const data = newSlots.map(entry => {
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
  console.log('Inserted missing slots:', newSlots);
}

run().catch(console.error).finally(() => prisma.$disconnect());
