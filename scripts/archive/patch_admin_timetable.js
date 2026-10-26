const fs = require('fs');

const file = `D:\\RFID-Smart-Attendance-System\\frontend\\src\\app\\admin\\timetable\\page.tsx`;
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `import { Loader2, Plus, Edit, Trash2 } from "lucide-react";`,
  `import { Loader2, Plus, Edit, Trash2, LayoutGrid, List, Clock } from "lucide-react";`
);

content = content.replace(
  `const [loading, setLoading] = useState(true);`,
  `const [loading, setLoading] = useState(true);\n  const [viewMode, setViewMode] = useState<"list" | "grid">("list");`
);

// We need a helper to generate the weeklySchedule map
const gridLogic = `
  const getScheduleMap = () => {
    const scheduleMap: Record<string, Record<string, any[]>> = {};
    slots.forEach((slot) => {
      const dateObj = new Date(slot.startTime);
      const hour = dateObj.getUTCHours();
      const min = dateObj.getUTCMinutes();
      
      let periodName = "Period 1";
      if (hour === 8 || (hour === 9 && min === 20)) periodName = "Period 1";
      if (hour === 9 && min === 25) periodName = "Period 2";
      if (hour === 10) periodName = "Period 3";
      if (hour === 11) periodName = "Period 4";
      if (hour === 13) periodName = "Period 5";
      if (hour === 14) periodName = "Period 6";
      if (hour === 15 && min === 0) periodName = "Period 7";
      if (hour === 15 && min >= 30) periodName = "Period 8";
      
      if (!scheduleMap[periodName]) scheduleMap[periodName] = {};
      if (!scheduleMap[periodName][slot.dayOfWeek]) scheduleMap[periodName][slot.dayOfWeek] = [];
      
      const subj = subjects.find(s => s.id === slot.subjectId);
      const fac = faculties.find(f => f.id === slot.facultyId);
      
      scheduleMap[periodName][slot.dayOfWeek].push({
        ...slot,
        code: subj?.code || "SUB",
        title: subj?.name || "Subject",
        faculty: fac?.fullName || "Faculty",
        room: slot.roomNumber || "Classroom"
      });
    });
    return scheduleMap;
  };
  
  const scheduleMap = getScheduleMap();
  const periodsList = ["Period 1", "Period 2", "Period 3", "Period 4", "Lunch Break", "Period 5", "Period 6", "Period 7", "Period 8"];
`;

content = content.replace(
  `if (loading) return`,
  gridLogic + `\n  if (loading) return`
);

const toggleUI = `
        <div className="flex space-x-2">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center space-x-1">
            <button onClick={() => setViewMode('list')} className={\`p-1.5 rounded-md flex items-center transition-colors \${viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}\`} title="List View">
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')} className={\`p-1.5 rounded-md flex items-center transition-colors \${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}\`} title="Grid View">
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button onClick={openAdd} className="flex items-center space-x-2 bg-[#0B2C5C] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#071E40] transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Slot</span>
          </button>
        </div>
`;

content = content.replace(
  `<button onClick={openAdd} className="flex items-center space-x-2 bg-[#0B2C5C] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#071E40] transition-colors">\n          <Plus className="w-4 h-4" />\n          <span>Add Slot</span>\n        </button>`,
  toggleUI
);

const gridTableView = `
      {viewMode === "grid" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1000px]">
            <thead className="bg-[#EEF2F8] text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 border-r border-[#E2E8F0] w-24 text-center">Day</th>
                {periodsList.map((period) => (
                  <th key={period} className="p-3 text-center border-r border-[#E2E8F0]">
                    {period === "Lunch Break" ? "Lunch" : period.replace("Period ", "P")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {["MON", "TUE", "WED", "THU", "FRI", "SAT"].map((dayKey, rowIdx) => {
                return (
                  <tr key={dayKey} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 border-r border-[#E2E8F0] font-mono font-bold text-center align-middle text-[#0B2C5C] bg-[#F8FAFC]">
                      {dayKey}
                    </td>
                    {periodsList.map((period) => {
                      if (period === "Lunch Break") {
                        if (rowIdx === 0) {
                          return (
                            <td key={period} rowSpan={6} className="p-2 border-r border-[#E2E8F0] text-center font-bold text-slate-400 text-sm bg-[#F8FAFC] tracking-[0.3em]" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                              LUNCH BREAK
                            </td>
                          );
                        }
                        return null;
                      }
                      
                      const cellSlots = scheduleMap[period] && scheduleMap[period][dayKey];
                      return (
                        <td key={period} className="p-2.5 border-r border-[#E2E8F0] align-top min-w-[150px]">
                          {cellSlots && cellSlots.length > 0 ? (
                            <div className="flex flex-col space-y-2 h-full">
                              {cellSlots.map((cell: any, i: number) => (
                                <div key={i} className="p-3 rounded-xl border bg-white border-[#E2E8F0] relative group">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-mono text-[10px] font-black text-[#0B2C5C]">{cell.code}</span>
                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2">
                                      <button onClick={() => openEdit(cell)} className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><Edit className="w-3 h-3" /></button>
                                      <button onClick={() => handleDelete(cell.id)} className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                  </div>
                                  <div className="font-bold text-slate-900 text-xs leading-snug">{cell.title}</div>
                                  <div className="text-[9px] text-slate-500 mt-2 flex flex-col space-y-1">
                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-2.5 h-2.5 opacity-70" />
                                      <span className="truncate">{cell.faculty}</span>
                                    </div>
                                    <div className="font-mono text-[9px]">{cell.room}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-full min-h-[80px] rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center">
                              <span className="text-[10px] text-slate-400 font-bold">FREE</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
`;

content = content.replace(
  `<div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">`,
  gridTableView + `\n      {viewMode === "list" && (\n      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">`
);

content = content.replace(
  `</table>\n      </div>\n\n      {showModal`,
  `</table>\n      </div>\n      )}\n\n      {showModal`
);

fs.writeFileSync(file, content);
console.log('Admin timetable updated with Grid View');
