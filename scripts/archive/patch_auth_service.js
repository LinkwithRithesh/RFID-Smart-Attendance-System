const fs = require('fs');
const file = 'D:\\RFID-Smart-Attendance-System\\backend\\src\\services\\auth.service.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('personalEmail: payload.personalEmail')) {
  content = content.replace(
    'email: payload.email,',
    'email: payload.email,\n        personalEmail: payload.personalEmail || null,'
  );
  fs.writeFileSync(file, content);
  console.log('Added personalEmail to auth.service.js user creation');
} else {
  console.log('personalEmail already in auth.service.js');
}
