"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { Calendar as CalendarIcon, Clock, Download, Plus } from "lucide-react";

export default function TimetablePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [viewMode, setViewMode] = useState<"week" | "today">("week");

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const fullDaysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const currentDayKey = daysOfWeek[currentTime.getDay()];
  const currentDayName = fullDaysOfWeek[currentTime.getDay()];

  const currentHour = currentTime.getHours();
  let currentPeriodIdx = -1;
  if (currentHour === 9) currentPeriodIdx = 0; // Period 1
  else if (currentHour === 10) currentPeriodIdx = 1; // Period 2
  else if (currentHour === 11) currentPeriodIdx = 2; // Period 3
  else if (currentHour === 13) currentPeriodIdx = 3; // Period 4
  else if (currentHour === 14) currentPeriodIdx = 5; // Period 5 (idx 5, lunch is idx 4)
  else if (currentHour === 15) currentPeriodIdx = 6; // Period 6
  else if (currentHour === 16) currentPeriodIdx = 7; // Period 7
  else if (currentHour === 17) currentPeriodIdx = 8; // Period 8

  const weeklySchedule: Record<string, Record<string, any>> = {
    "Period 1": {
      MON: { code: "EC23C13", title: "Digital Electronics & Sys", room: "Classroom", faculty: "Ewins Pon Pushpa", type: "Theory" },
      TUE: { code: "MA23C03", title: "Linear Algebra & Num Methods", room: "Classroom", faculty: "Murali Doss K", type: "Theory", isCurrent: false },
      WED: { code: "MA23C03", title: "Linear Algebra & Num Methods", room: "Classroom", faculty: "Murali Doss K", type: "Theory" },
      THU: { code: "EC23301", title: "Electromagnetic Fields", room: "Classroom", faculty: "Gulam Nabi", type: "Theory" },
      FRI: { code: "EC23302", title: "Signals & Systems", room: "Classroom", faculty: "Sridarshini T", type: "Theory" },
    },
    "Period 2": {
      MON: { code: "EC23C13", title: "Digital Electronics & Sys", room: "Classroom", faculty: "Ewins Pon Pushpa", type: "Theory" },
      TUE: { code: "MA23C03", title: "Linear Algebra & Num Methods", room: "Classroom", faculty: "Murali Doss K", type: "Theory", isCurrent: true },
      WED: { code: "MA23C03", title: "Linear Algebra & Num Methods", room: "Classroom", faculty: "Murali Doss K", type: "Theory" },
      THU: { code: "EC23301", title: "Electromagnetic Fields", room: "Classroom", faculty: "Gulam Nabi", type: "Theory" },
      FRI: { code: "EC23302", title: "Signals & Systems", room: "Classroom", faculty: "Sridarshini T", type: "Theory" },
    },
    "Period 3": {
      MON: { code: "EC23C02", title: "Analog Circuits Design", room: "Classroom", faculty: "Senbagakuzhalvaimozhi", type: "Theory" },
      TUE: { code: "EC23C02", title: "Analog Circuits Design", room: "Classroom", faculty: "Senbagakuzhalvaimozhi", type: "Theory" },
      WED: { code: "EC23C13", title: "Digital Electronics & Sys", room: "Classroom", faculty: "Ewins Pon Pushpa", type: "Theory" },
      THU: { code: "EC23301", title: "Electromagnetic Fields", room: "Classroom", faculty: "Gulam Nabi", type: "Theory" },

    },
    "Period 4": {
      MON: { code: "EC23S01", title: "Signal Processing Python", room: "Lab", faculty: "Steffi Snow P", type: "Nan Mudhalvan" },
      TUE: { code: "EC23C02", title: "Analog Circuits Design", room: "Classroom", faculty: "Senbagakuzhalvaimozhi", type: "Theory" },
      WED: { code: "EC23302", title: "Signals & Systems", room: "Classroom", faculty: "Sridarshini T", type: "Theory" },
    },
    "Lunch Break": {},
    "Period 5": {
      MON: { code: "UC23U01", title: "Universal Human Values", room: "Classroom", faculty: "Sridarshini T", type: "Theory" },
      TUE: { code: "SKILL", title: "Skill Development", room: "Classroom", faculty: "Steffi Snow P", type: "Skill" },
      WED: { code: "SKILL", title: "Skill Development", room: "Classroom", faculty: "Steffi Snow P", type: "Skill" },
      THU: { code: "EC23C13", title: "Digital Electronics Lab", room: "Lab", faculty: "Ewins Pon Pushpa", type: "Practical" },
      FRI: { code: "UC23U01", title: "Universal Human Values Lab", room: "Lab", faculty: "Sridarshini T", type: "Practical" },
    },
    "Period 6": {
      WED: { code: "SKILL", title: "Skill Development", room: "Classroom", faculty: "Steffi Snow P", type: "Skill" },
      THU: { code: "EC23C13", title: "Digital Electronics Lab", room: "Lab", faculty: "Ewins Pon Pushpa", type: "Practical" },
      FRI: { code: "UC23U01", title: "Universal Human Values Lab", room: "Lab", faculty: "Sridarshini T", type: "Practical" },
    },
    "Period 7": {
      WED: { code: "SKILL", title: "Skill Development", room: "Classroom", faculty: "Steffi Snow P", type: "Skill" },
      THU: { code: "EC23C13", title: "Digital Electronics Lab", room: "Lab", faculty: "Ewins Pon Pushpa", type: "Practical" },
    },
    "Period 8": {
      WED: { code: "SKILL", title: "Skill Development", room: "Classroom", faculty: "Steffi Snow P", type: "Skill" },
      THU: { code: "EC23C13", title: "Digital Electronics Lab", room: "Lab", faculty: "Ewins Pon Pushpa", type: "Practical" },
      FRI: { code: "AUDIT", title: "Audit Course", room: "Classroom", faculty: "Temp Staff", type: "Audit" },
    },
  };

  const handleDownloadPDF = () => {
    alert("Exporting official Anna University verified Semester 3 Timetable PDF...");
  };

  return (
    <DashboardShell>
      <div className="space-y-6 font-sans text-slate-800">
        <PageHeader
          title="Class Timetable & Active Lecture Schedule"
          subtitle="Semester 3 • ECE Section B • Weekly period mapping with live turnstile sensor tracking"
          breadcrumb={[{ label: "Academic Timetable" }]}
          categoryTag="ACADEMIC CURRICULUM SCHEDULE"
          action={
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Timetable PDF</span>
              </button>
            </div>
          }
        />

        {/* View Switcher Controls */}
        <div className="flex items-center space-x-2 bg-white border border-[#E2E8F0] p-1.5 rounded-2xl shadow-xs w-fit">
          <button
            onClick={() => setViewMode("week")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === "week"
              ? "bg-[#0B2C5C] text-white shadow-xs"
              : "text-slate-600 hover:text-[#0B2C5C]"
              }`}
          >
            Weekly Grid View
          </button>
          <button
            onClick={() => setViewMode("today")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === "today"
              ? "bg-[#0B2C5C] text-white shadow-xs"
              : "text-slate-600 hover:text-[#0B2C5C]"
              }`}
          >
            Today&apos;s Schedule Only
          </button>
        </div>

        {/* Weekly Grid View */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs overflow-x-auto space-y-4">
          <div className="flex items-center justify-between text-xs font-bold border-b border-slate-100 pb-3">
            <span className="text-[#0B2C5C] uppercase tracking-wider">
              Department of Electronics & Communication Engineering • Room 104
            </span>
            <span className="text-emerald-700 font-mono flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
              <span>Active {currentDayName} Lecture Schedule</span>
            </span>
          </div>

          <table className="w-full text-left text-xs min-w-[1000px]">
            <thead className="bg-[#EEF2F8] text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 border-r border-[#E2E8F0] w-24 text-center">Day</th>
                {["Period 1", "Period 2", "Period 3", "Period 4", "Lunch Break", "Period 5", "Period 6", "Period 7", "Period 8"].map((period, idx) => (
                  <th key={period} className={`p-3 text-center border-r border-[#E2E8F0] ${idx === currentPeriodIdx ? "bg-[#0B2C5C] text-white" : ""}`}>
                    {period === "Lunch Break" ? "Lunch" : period.replace("Period ", "P")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {["MON", "TUE", "WED", "THU", "FRI"].map((dayKey, rowIdx) => {
                const isTodayRow = dayKey === currentDayKey;
                const periodsList = ["Period 1", "Period 2", "Period 3", "Period 4", "Lunch Break", "Period 5", "Period 6", "Period 7", "Period 8"];
                
                return (
                  <tr key={dayKey} className={`hover:bg-slate-50 transition-colors ${isTodayRow ? "bg-blue-50/10" : ""}`}>
                    <td className={`p-3 border-r border-[#E2E8F0] font-mono font-bold text-center align-middle ${isTodayRow ? "bg-[#0B2C5C] text-white" : "text-[#0B2C5C] bg-[#F8FAFC]"}`}>
                      {dayKey}
                      {isTodayRow && <div className="text-[9px] mt-1 text-emerald-400 font-black tracking-widest uppercase">TODAY</div>}
                    </td>

                    {periodsList.map((period, idx) => {
                      if (period === "Lunch Break") {
                        if (rowIdx === 0) {
                          return (
                            <td key={period} rowSpan={5} className="p-2 border-r border-[#E2E8F0] text-center font-bold text-slate-400 text-sm bg-[#F8FAFC] tracking-[0.3em]" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                              LUNCH BREAK
                            </td>
                          );
                        }
                        return null;
                      }

                      const cell = weeklySchedule[period] && weeklySchedule[period][dayKey];
                      const isCurrentPeriod = isTodayRow && idx === currentPeriodIdx;

                      return (
                        <td
                          key={period}
                          className="p-2.5 border-r border-[#E2E8F0] align-top min-w-[150px]"
                        >
                          {cell ? (
                            <div
                              className={`p-3 rounded-xl border transition-all h-full ${isCurrentPeriod
                                ? "border-[#0B2C5C] bg-[#EEF2F8] shadow-sm animate-current-period"
                                : "bg-white border-[#E2E8F0] hover:border-slate-400"
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] font-black text-[#0B2C5C]">
                                  {cell.code}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${cell.type === "Practical" || cell.type === "Lab"
                                    ? "bg-purple-100 text-purple-800"
                                    : cell.type === "Skill" 
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-blue-100 text-blue-800"
                                    }`}
                                >
                                  {cell.type}
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 text-xs mt-1 leading-snug">
                                {cell.title}
                              </div>
                              <div className="text-[9px] text-slate-500 mt-2 flex flex-col space-y-1">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-2.5 h-2.5 opacity-70" />
                                  <span className="truncate">{cell.faculty}</span>
                                </div>
                                <div className="font-mono bg-slate-100 px-1 py-0.5 rounded w-fit">
                                  {cell.room}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full min-h-[80px]">
                              <span className="text-slate-300">—</span>
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
      </div>
    </DashboardShell>
  );
}
