const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function timeToDate(timeStr) {
  const [h, m, s] = timeStr.split(':');
  return new Date(Date.UTC(1970, 0, 1, parseInt(h), parseInt(m), parseInt(s)));
}

async function run() {
  // 1. Fix Friday G-Lab (UHV) -> only periods 5 & 6.
  // Period 7 is 15:00:00 - 15:50:00
  // Period 8 is 15:55:00 - 16:45:00
  const friGLab7 = await prisma.timetable.findFirst({
    where: {
      dayOfWeek: 'FRI',
      subjectId: 10, // UHV
      startTime: timeToDate('15:00:00')
    }
  });
  if (friGLab7) {
    await prisma.timetable.delete({ where: { id: friGLab7.id } });
    console.log('Deleted Friday G-Lab Period 7');
  }

  const friGLab8 = await prisma.timetable.findFirst({
    where: {
      dayOfWeek: 'FRI',
      subjectId: 10, // UHV
      startTime: timeToDate('15:55:00')
    }
  });
  if (friGLab8) {
    await prisma.timetable.delete({ where: { id: friGLab8.id } });
    console.log('Deleted Friday G-Lab Period 8');
  }

  // 2. Update Friday Audit to be 15:55 to 17:30
  // First, find the audit course on Friday
  const friAudit = await prisma.timetable.findFirst({
    where: {
      dayOfWeek: 'FRI',
      subjectId: 13 // Audit
    }
  });
  if (friAudit) {
    await prisma.timetable.update({
      where: { id: friAudit.id },
      data: {
        startTime: timeToDate('15:55:00'),
        endTime: timeToDate('17:30:00')
      }
    });
    console.log('Updated Friday Audit time to 15:55 - 17:30');
  }

  // 3. For Thursday Alternating Lab (Analog / Digital)
  // Let's add the Digital Lab (Subject 8) overlapping with Analog Lab (Subject 7)
  // for Periods 5, 6, 7, 8 on Thursday.
  const thuAnalogLabs = await prisma.timetable.findMany({
    where: {
      dayOfWeek: 'THU',
      subjectId: 7 // Analog
    }
  });
  
  if (thuAnalogLabs.length > 0) {
    console.log('Found Analog labs on Thursday, adding corresponding Digital labs...');
    for (const lab of thuAnalogLabs) {
      // Check if digital lab already exists here
      const existing = await prisma.timetable.findFirst({
        where: {
          dayOfWeek: 'THU',
          subjectId: 8, // Digital
          startTime: lab.startTime
        }
      });
      if (!existing) {
        await prisma.timetable.create({
          data: {
            subjectId: 8, // Digital
            facultyId: 14, // Ewins Pon Pushpa S
            departmentId: 1,
            roomNumber: 'KP 104',
            dayOfWeek: 'THU',
            startTime: lab.startTime,
            endTime: lab.endTime,
            semester: 3,
            academicYear: '2026-2027'
          }
        });
        console.log(`Added Digital lab on Thursday at ${lab.startTime.toISOString()}`);
      }
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
