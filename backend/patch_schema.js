const fs = require('fs');
const file = 'D:\\RFID-Smart-Attendance-System\\backend\\prisma\\schema.prisma';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('personalEmail')) {
  content = content.replace(
    'email                String                @unique(map: "email") @db.VarChar(150)',
    'email                String                @unique(map: "email") @db.VarChar(150)\n  personalEmail        String?               @map("personal_email") @db.VarChar(150)'
  );
  fs.writeFileSync(file, content);
  console.log('Added personalEmail to schema.prisma');
} else {
  console.log('personalEmail already exists in schema.prisma');
}
