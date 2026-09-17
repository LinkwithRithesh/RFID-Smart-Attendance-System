const fs = require('fs');
const file = 'D:\\RFID-Smart-Attendance-System\\backend\\src\\validations\\auth.validation.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('personalEmail')) {
  content = content.replace(
    "email: z.string().email('Valid email is required'),",
    "email: z.string().email('Valid email is required'),\n    personalEmail: z.string().email('Valid personal email is required').optional(),"
  );
  fs.writeFileSync(file, content);
  console.log('Added personalEmail to auth.validation.js');
} else {
  console.log('personalEmail already exists in auth.validation.js');
}
