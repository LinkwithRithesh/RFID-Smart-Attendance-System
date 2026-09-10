const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.studentProfile.create({
    data: {
      userId: 4,
      rollNumber: '2024105002',
      courseId: 1,
      currentSemester: 5,
      admissionYear: 2024
    }
  });
  console.log('Fixed user 4');
  await prisma.$disconnect();
}
run();
