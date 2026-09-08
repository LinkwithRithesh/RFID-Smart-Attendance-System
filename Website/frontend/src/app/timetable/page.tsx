"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { Calendar as CalendarIcon, Clock, Download, Plus } from "lucide-react";

export default function TimetablePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [viewMode, setViewMode] = useState<"week" | "today">("week");

  // Weekly Schedule Data
  const weeklySchedule: Record<string, Record<string, any>> = {
    "Period 1 (09:00 - 10:00 AM)": {
      MON: { code: "EC3401", title: "Electromagnetic Fields", room: "Room 302", faculty: "Dr. S. Ramesh", type: "Lecture" },
      TUE: { code: "EC3401", title: "Electromagnetic Fields", room: "Room 302", faculty: "Dr. S. Ramesh", type: "Lecture", isCurrent: false },
      WED: { code: "EC3402", title: "Signals & Systems", room: "Room 302", faculty: "Dr. K. Arumugam", type: "Lecture" },
      THU: { code: "EC3403", title: "Analog Circuits", room: "Room 304", faculty: "Prof. N. Venkatesh", type: "Lecture" },
      FRI: { code: "EC3404", title: "Digital Communications", room: "Room 302", faculty: "Dr. P. Sundaram", type: "Lecture" },
    },
    "Period 2 (10:00 - 11:00 AM)": {
      MON: { code: "EC3402", title: "Signals & Systems", room: "Room 302", faculty: "Dr. K. Arumugam", type: "Lecture" },
      TUE: { code: "EC3402", title: "Signals & Systems", room: "Room 302", faculty: "Dr. K. Arumugam", type: "Lecture", isCurrent: true },
      WED: { code: "EC3401", title: "Electromagnetic Fields", room: "Room 302", faculty: "Dr. S. Ramesh", type: "Lecture" },
      THU: { code: "EC3404", title: "Digital Communications", room: "Room 302", faculty: "Dr. P. Sundaram", type: "Lecture" },
      FRI: { code: "EC3403", title: "Analog Circuits", room: "Room 304", faculty: "Prof. N. Venkatesh", type: "Lecture" },
    },
    "Period 3 (11:15 - 12:15 PM)": {
      MON: { code: "EC3403", title: "Analog Circuits", room: "Room 304", faculty: "Prof. N. Venkatesh", type: "Lecture" },
      TUE: { code: "EC3403", title: "Analog Circuits", room: "Room 304", faculty: "Prof. N. Venkatesh", type: "Lecture" },
      WED: { code: "EC3404", title: "Digital Communications", room: "Room 302", faculty: "Dr. P. Sundaram", type: "Lecture" },
      THU: { code: "EC3401", title: "Electromagnetic Fields", room: "Room 302", faculty: "Dr. S. Ramesh", type: "Lecture" },
      FRI: { code: "EC3402", title: "Signals & Systems", room: "Room 302", faculty: "Dr. K. Arumugam", type: "Lecture" },
    },
    "Lunch Break": {},
    "Period 4 & 5 (01:30 - 03:30 PM)": {
      MON: { code: "EC3411", title: "Analog Circuits Lab", room: "Lab 2", faculty: "Prof. N. Venkatesh", type: "Lab" },
      TUE: { code: "EC3411", title: "Analog Circuits Lab", room: "Lab 2", faculty: "Prof. N. Venkatesh", type: "Lab" },
      WED: { code: "EC3412", title: "Circuits Simulation Lab", room: "IoT Lab", faculty: "Dr. S. Ramesh", type: "Lab" },
      THU: { code: "LIB", title: "Library & Self Study", room: "Central Lib", faculty: "Staff In-charge", type: "Library" },
      FRI: { code: "SEM", title: "Technical Seminar", room: "Auditorium", faculty: "HOD / Faculty", type: "Seminar" },
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
          subtitle="Semester 3 • ECE Section A • Weekly period mapping with live turnstile sensor tracking"
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
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "week"
                ? "bg-[#0B2C5C] text-white shadow-xs"
                : "text-slate-600 hover:text-[#0B2C5C]"
            }`}
          >
            Weekly Grid View
          </button>
          <button
            onClick={() => setViewMode("today")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "today"
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
              Department of Electronics & Communication Engineering • Room 302
            </span>
            <span className="text-emerald-700 font-mono flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
              <span>Active Tuesday Lecture Schedule</span>
            </span>
          </div>

          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-[#EEF2F8] text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 border-r border-[#E2E8F0] w-32">Period & Time</th>
                <th className="p-3 w-1/5 text-center">MON</th>
                <th className="p-3 w-1/5 text-center bg-[#0B2C5C] text-white font-black">
                  TUE (TODAY)
                </th>
                <th className="p-3 w-1/5 text-center">WED</th>
                <th className="p-3 w-1/5 text-center">THU</th>
                <th className="p-3 w-1/5 text-center">FRI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {Object.entries(weeklySchedule).map(([period, days], idx) => {
                if (period === "Lunch Break") {
                  return (
                    <tr key={idx} className="bg-[#F8FAFC] text-center font-bold text-slate-500 text-[11px]">
                      <td className="p-2 border-r border-[#E2E8F0] font-mono">LUNCH</td>
                      <td colSpan={5} className="p-2 uppercase tracking-widest text-slate-600">
                        12:15 PM – 01:30 PM • LUNCH BREAK
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 border-r border-[#E2E8F0] font-mono font-bold text-[#0B2C5C] bg-[#F8FAFC]">
                      {period}
                    </td>

                    {["MON", "TUE", "WED", "THU", "FRI"].map((dayKey) => {
                      const cell = days[dayKey];
                      const isTodayCol = dayKey === "TUE";

                      return (
                        <td
                          key={dayKey}
                          className={`p-2.5 border-r border-[#E2E8F0] align-top ${
                            isTodayCol ? "bg-blue-50/20" : ""
                          }`}
                        >
                          {cell ? (
                            <div
                              className={`p-3 rounded-xl border transition-all ${
                                cell.isCurrent
                                  ? "border-[#0B2C5C] bg-[#EEF2F8] shadow-sm animate-current-period"
                                  : "bg-white border-[#E2E8F0] hover:border-slate-400"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-black text-[#0B2C5C]">
                                  {cell.code}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    cell.type === "Lab"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {cell.type}
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 text-xs mt-1 leading-snug">
                                {cell.title}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                                <span>{cell.room}</span>
                                <span>{cell.faculty}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300 text-center block py-4">—</span>
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
