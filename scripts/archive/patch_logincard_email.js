const fs = require('fs');
const file = 'D:\\RFID-Smart-Attendance-System\\frontend\\src\\components\\login\\LoginCard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update Payload 1
content = content.replace(
  'email: `${regMobile.trim()}@temp.local`,',
  'email: regPersonalEmail.trim(),\n          personalEmail: regPersonalEmail.trim(),'
);

// Update Payload 2
content = content.replace(
  'email: `${regMobile.trim()}@temp.local`,',
  'email: regPersonalEmail.trim(),\n          personalEmail: regPersonalEmail.trim(),'
);

// Replace the UI for Mobile Number to include Personal Email ID
const uiRegex = /<div className="grid grid-cols-1 gap-2.5">([\s\S]*?)<label className="block text-slate-700 font-bold mb-1">Mobile Number \*/;
const uiReplacement = `<div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Personal Mail ID *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@gmail.com"
                      value={regPersonalEmail}
                      onChange={(e) => setRegPersonalEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-slate-900 focus:outline-none focus:border-[#0B2C5C]"
                    />
                  </div>$1<label className="block text-slate-700 font-bold mb-1">Mobile Number *`;

content = content.replace(uiRegex, uiReplacement);

fs.writeFileSync(file, content);
console.log("LoginCard.tsx updated successfully.");
