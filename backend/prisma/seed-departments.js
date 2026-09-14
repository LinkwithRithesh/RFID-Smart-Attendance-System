const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const departments = [
    { name: 'Computer Science and Engineering', code: 'CSE' },
    { name: 'Information Technology', code: 'IT' },
    { name: 'Electronics and Communication Engineering', code: 'ECE' },
    { name: 'Electrical and Electronics Engineering', code: 'EEE' },
    { name: 'Mechanical Engineering', code: 'MECH' },
    { name: 'Civil Engineering', code: 'CIVIL' },
    { name: 'Artificial Intelligence and Data Science', code: 'AIDS' },
    { name: 'Business Administration', code: 'BBA' },
    { name: 'Science and Humanities', code: 'SH' }
  ];

  for (const dept of departments) {
    let d = await prisma.department.findUnique({ where: { name: dept.name } });
    if (!d) {
      d = await prisma.department.findUnique({ where: { code: dept.code } });
      if (!d) {
        d = await prisma.department.create({ data: dept });
        console.log(`Created department: ${d.name}`);
      }
    } else {
      console.log(`Department already exists: ${d.name}`);
    }

    const courses = [
      { name: `B.Tech ${dept.name}`, code: `BT-${dept.code}`, durationSemesters: 8 },
      { name: `M.Tech ${dept.name}`, code: `MT-${dept.code}`, durationSemesters: 4 },
    ];

    if (dept.code === 'BBA') {
      courses.push({ name: `MBA`, code: `MBA`, durationSemesters: 4 });
    }

    for (const crs of courses) {
      let c = await prisma.course.findUnique({ where: { code: crs.code } });
      if (!c) {
        c = await prisma.course.create({ data: { ...crs, departmentId: d.id } });
        console.log(`Created course: ${c.name}`);
      } else {
        console.log(`Course already exists: ${c.name}`);
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
