const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const u = await prisma.user.findUnique({
      where: { id: 4 },
      include: {
        role: true,
        department: true,
        studentProfile: { include: { course: true } },
        facultyProfile: true,
        administratorProfile: true,
        hodProfile: true,
        deanProfile: true,
        officeStaffProfile: true,
        labAssistantProfile: true,
        securityProfile: true,
        housekeepingProfile: true,
        maintenanceProfile: true
      }
    });
    console.log(JSON.stringify(u, null, 2));
  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
