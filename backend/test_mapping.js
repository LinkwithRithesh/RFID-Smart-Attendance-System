const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const subjects = await prisma.subject.findMany();
  console.log('Subjects:', subjects);
  
  const faculties = await prisma.user.findMany({ where: { role: { name: 'FACULTY' } }});
  console.log('Faculties:', faculties.map(f => ({ id: f.id, name: f.fullName })));
}

run().catch(console.error).finally(() => prisma.$disconnect());
