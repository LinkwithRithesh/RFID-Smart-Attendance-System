const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const now = new Date();
  const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][now.getDay()];
  
  // Set start time to 10 mins ago, end time to 50 mins from now
  const startTime = new Date(1970, 0, 1, now.getHours(), now.getMinutes() - 5, 0);
  const endTime = new Date(1970, 0, 1, now.getHours() + 1, now.getMinutes(), 0);

  console.log(`Adding test slot for ${dayOfWeek} from ${startTime.toISOString()} to ${endTime.toISOString()}`);
  
  const newSlot = await prisma.timetable.create({
    data: {
      subjectId: 8,
      facultyId: 14,
      departmentId: 1,
      roomNumber: 'TEST',
      dayOfWeek: dayOfWeek,
      startTime: startTime,
      endTime: endTime,
      semester: 3,
      academicYear: '2026-2027'
    }
  });
  console.log('Created slot:', newSlot);

  const sessions = await prisma.attendanceSession.findMany({ where: { status: 'OPEN' } });
  console.log('Open Sessions now:', sessions);
}

run().catch(console.error).finally(() => prisma.$disconnect());
