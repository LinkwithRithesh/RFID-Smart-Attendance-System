const fs = require('fs');
const file = 'D:\\RFID-Smart-Attendance-System\\backend\\src\\controllers\\adminRegistration.controller.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("require('../services/email.service')")) {
  content = "const emailService = require('../services/email.service');\n" + content;
}

const emailLogic = `
    const emailTarget = updated.personalEmail || user.personalEmail || user.email;
    if (emailTarget) {
      const actualId = roleName === 'STUDENT' ? rollNumber : employeeId;
      const passText = (actualId && actualId.toString().length >= 4) ? actualId.toString().slice(-4) : actualId;
      
      const emailText = \`Dear \${updated.fullName},

Congratulations! You have been successfully approved and selected as a \${roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase()} in our institution. We are incredibly proud to welcome you to the Smart Campus!

Your official account has been provisioned. Below are your login credentials:

Login ID / Official Email: \${updated.email}
Assigned \${roleName === 'STUDENT' ? 'Enrollment Number' : 'Employee ID'}: \${actualId}
Password: \${passText}

Please log in to the SmartAttend portal using the credentials above. We highly recommend changing your password upon your first login.

Welcome aboard!
SmartAttend Admin Team\`;

      await emailService.sendEmail({
        to: emailTarget,
        subject: \`Application Approved - Welcome to SmartAttend!\`,
        text: emailText
      });
    }
`;

if (!content.includes('emailService.sendEmail')) {
  content = content.replace(
    "return success(res, 200, 'Registration approved successfully', {",
    emailLogic + "\n    return success(res, 200, 'Registration approved successfully', {"
  );
  fs.writeFileSync(file, content);
  console.log("Email logic added to adminRegistration.controller.js");
} else {
  console.log("Email logic already exists.");
}
