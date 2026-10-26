const fs = require('fs');
const file = 'D:\\RFID-Smart-Attendance-System\\frontend\\src\\components\\login\\LoginCard.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('regPersonalEmail')) {
  // Add state
  content = content.replace(
    'const [regEmail, setRegEmail] = useState("");',
    'const [regEmail, setRegEmail] = useState("");\n  const [regPersonalEmail, setRegPersonalEmail] = useState("");'
  );

  // Add to payload
  content = content.replace(
    'email: regEmail.trim(),',
    'email: regEmail.trim(),\n        personalEmail: regPersonalEmail.trim(),'
  );

  // Find the email input field and add the personal email input field right after it.
  // We'll search for the block that renders the regEmail input.
  const emailInputRegex = /<div>\s*<label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">\s*College Email ID\s*<\/label>[\s\S]*?<\/div>/;
  
  const match = content.match(emailInputRegex);
  if (match) {
    const emailBlock = match[0];
    const personalEmailBlock = emailBlock
      .replace('College Email ID', 'Personal Email ID')
      .replace('regEmail', 'regPersonalEmail')
      .replace('setRegEmail', 'setRegPersonalEmail')
      .replace('placeholder="student@college.edu"', 'placeholder="personal@gmail.com"');
      
    content = content.replace(emailBlock, emailBlock + '\n\n' + personalEmailBlock);
  }

  fs.writeFileSync(file, content);
  console.log('Added personalEmail to LoginCard.tsx');
} else {
  console.log('regPersonalEmail already exists in LoginCard.tsx');
}
