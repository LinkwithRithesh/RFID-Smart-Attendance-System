const fs = require('fs');
const file = 'D:\\RFID-Smart-Attendance-System\\frontend\\src\\app\\profile\\page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<label className="block text-slate-700 font-bold mb-1">Student Email<\/label>\s*<input\s*type="email"\s*required\s*value={email}\s*onChange={\(e\) => setEmail\(e\.target\.value\)}\s*className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"\s*\/>/g,
  '<label className="block text-slate-700 font-bold mb-1">Institutional Email</label><input type="email" disabled value={email} className="w-full p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed opacity-75" title="Institutional email cannot be changed" />'
);

fs.writeFileSync(file, content);
console.log("Done");
