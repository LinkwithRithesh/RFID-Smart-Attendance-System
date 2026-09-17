const fs = require('fs');
const file = 'D:\\RFID-Smart-Attendance-System\\backend\\src\\controllers\\attendance.controller.js';
let content = fs.readFileSync(file, 'utf8');

const replacement = `async function markManual(req, res, next) {
  try {
    const payload = req.body;
    
    // Check if the provided userId is actually a string (like a roll number)
    if (typeof payload.userId === 'string') {
      const prisma = require('../config/database');
      const ApiError = require('../utils/ApiError');
      
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { rollNumber: payload.userId }
      });
      
      if (studentProfile) {
        payload.userId = studentProfile.userId;
      } else {
        const parsed = parseInt(payload.userId, 10);
        if (!isNaN(parsed) && parsed.toString() === payload.userId) {
            payload.userId = parsed;
        } else {
            throw new ApiError(404, "Student Roll Number not found.");
        }
      }
    }
    
    const attendance = await attendanceService.markManual(payload, req.user.id);
    return success(res, 201, 'Attendance marked', attendance);
  } catch (err) {
    next(err);
  }
}`;

content = content.replace(/async function markManual\(req, res, next\) \{[\s\S]*?\} catch \(err\) \{\s*next\(err\);\s*\}\s*\}/, replacement);

if (!content.includes('ApiError')) {
    content = "const ApiError = require('../utils/ApiError');\n" + content;
}

fs.writeFileSync(file, content);
console.log("Patched attendance.controller.js");
