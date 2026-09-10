"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/services/apiClient";
import {
  CalendarCheck,
  ClipboardCheck,
  Calendar as CalendarIcon,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Radio,
  ScanFace,
  ShieldCheck,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function AttendancePage() {
  const { user } = useAuth();
  const studentRoll = user?.userId || "2025105002";

  const [activeTab, setActiveTab] = useState<"details" | "statement">("details");
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [overallStats, setOverallStats] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    apiClient.get("/attendance/summary").then(res => { if(mounted) setSubjects(res.data?.subjects || []); });
    apiClient.get("/dashboard/student/stats").then(res => { if(mounted) setOverallStats(res.data); });
    return () => { mounted = false; };
  }, [studentRoll]);


  // Selected subject for monthly calendar modal
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<number>(8);
  const [calendarLogs, setCalendarLogs] = useState<Record<number, any>>({});

  // Statement Filters
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [semester, setSemester] = useState("Semester 3");
  const [statementSubject, setStatementSubject] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("2026-07-01");
  const [dateTo, setDateTo] = useState("2026-09-04");

  

  useEffect(() => {
    if (selectedSubject) {
      const timer = setTimeout(() => {
        const logs: any[] = []; // TODO fetch calendar logs from backend
        setCalendarLogs(logs);
        setSelectedDate(8);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedSubject, studentRoll]);

  const handleExportCSV = async () => {
    if (process.env.NEXT_PUBLIC_USE_MOCKS !== "true") {
      const res = await apiClient.downloadBlob(
        `/reports/statement/export?studentId=${user?.id || studentRoll}&format=csv`,
        `smartattend_statement_${studentRoll}.csv`
      );
      if (res.success) return;
    }

    // Client-side fallback if mock or backend offline
    const rows = [
      ["Course Code", "Subject Name", "Faculty", "Held", "Attended", "Absent", "Attendance %", "Status"],
      ...subjects.map((s) => [s.code, s.name, s.faculty, s.held, s.attended, s.absent, `${s.percentage}%`, s.status]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smartattend_statement_${studentRoll}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = async () => {
    if (process.env.NEXT_PUBLIC_USE_MOCKS !== "true") {
      const res = await apiClient.downloadBlob(
        `/reports/statement/export?studentId=${user?.id || studentRoll}&format=pdf`,
        `smartattend_statement_${studentRoll}.pdf`
      );
      if (res.success) return;
    }
    alert(`Generating official university stamped Attendance Statement PDF for Roll No: ${studentRoll}...`);
  };

  return (
    <DashboardShell>
      <div className="space-y-6 font-sans text-slate-800">
        <PageHeader
          title="Attendance Management & Verification"
          subtitle="Real-time RFID & AI Face Recognition attendance records, date-wise calendar, and official statements"
          breadcrumb={[{ label: "Attendance Details & Statements" }]}
          categoryTag="ACADEMIC ATTENDANCE MODULE"
          action={
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-xs flex items-center space-x-1.5 shadow-md transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Official PDF</span>
              </button>
            </div>
          }
        />

        {/* Tab Controls (Clean White Surface) */}
        <div className="flex items-center space-x-2 bg-white border border-[#E2E8F0] p-1.5 rounded-2xl shadow-xs w-fit">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "details"
                ? "bg-[#0B2C5C] text-white shadow-xs"
                : "text-slate-600 hover:text-[#0B2C5C]"
            }`}
          >
            A. Subject Attendance & Calendar Drill-down
          </button>
          <button
            onClick={() => setActiveTab("statement")}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "statement"
                ? "bg-[#0B2C5C] text-white shadow-xs"
                : "text-slate-600 hover:text-[#0B2C5C]"
            }`}
          >
            B. Official Semester Statement
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB A: ATTENDANCE DETAILS & SUBJECT ROSTER */}
        {/* ========================================================= */}
        {activeTab === "details" ? (
          <div className="space-y-6">
            {/* Subject Attendance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {subjects.map((s) => {
                const isShortage = s.status === "SHORTAGE";
                const isWarning = s.status === "WARNING";

                return (
                  <div
                    key={s.code}
                    className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-4 hover-lift"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#0B2C5C] bg-[#EEF2F8] px-2 py-0.5 rounded">
                          {s.code}
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-900 mt-1.5">{s.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{s.faculty}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black font-mono text-[#0B2C5C]">{s.percentage}%</div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase mt-1 ${
                            isShortage
                              ? "bg-rose-100 text-[#EF4444] border border-rose-300"
                              : isWarning
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#EEF2F8] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isShortage ? "bg-[#EF4444]" : isWarning ? "bg-amber-500" : "bg-[#0B2C5C]"
                        }`}
                        style={{ width: `${s.percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-600 pt-1 border-t border-slate-100">
                      <span>Attended: <strong className="text-slate-900">{s.attended}</strong> / {s.held}</span>
                      <span>Absent: <strong className="text-[#EF4444]">{s.absent}</strong></span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedSubject(s)}
                      className="w-full py-2 px-3 rounded-full bg-[#EEF2F8] hover:bg-[#0B2C5C] text-[#0B2C5C] hover:text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>View Monthly Calendar Drill-down</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* TAB B: OFFICIAL ATTENDANCE STATEMENT TABLE */
          /* ========================================================= */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                <div>
                  <h3 className="text-base font-black text-[#0B2C5C]">Official Academic Attendance Statement</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generated for Student Roll No: <span className="font-mono font-bold text-[#0B2C5C]">{studentRoll}</span> • Verified against CeGov Audit Ledger
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-500 uppercase">Overall Condonation Compliance</div>
                    <div className="text-xl font-black text-emerald-700 font-mono">{overallStats?.overallPercentage || 0}% (Compliant)</div>
                  </div>
                </div>
              </div>

              {/* Statement Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EEF2F8] text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Course Code</th>
                      <th className="p-3">Course Title</th>
                      <th className="p-3">Course In-Charge</th>
                      <th className="p-3 text-center">Classes Held</th>
                      <th className="p-3 text-center">Attended</th>
                      <th className="p-3 text-center">Absent</th>
                      <th className="p-3 text-right">Attendance %</th>
                      <th className="p-3 text-right">Academic Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {subjects.map((s) => (
                      <tr key={s.code} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-[#0B2C5C]">{s.code}</td>
                        <td className="p-3 font-bold text-slate-900">{s.name}</td>
                        <td className="p-3 text-slate-600">{s.faculty}</td>
                        <td className="p-3 text-center font-mono">{s.held}</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-700">{s.attended}</td>
                        <td className="p-3 text-center font-mono text-[#EF4444] font-bold">{s.absent}</td>
                        <td className="p-3 text-right font-mono font-black text-[#0B2C5C]">{s.percentage}%</td>
                        <td className="p-3 text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              s.status === "SHORTAGE"
                                ? "bg-rose-100 text-[#EF4444] border border-rose-300"
                                : s.status === "WARNING"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Calendar Drill-down Modal */}
        {selectedSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071E40]/60 backdrop-blur-xs p-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full shadow-2xl p-6 space-y-4 text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-[#0B2C5C] bg-[#EEF2F8] px-2 py-0.5 rounded">
                    {selectedSubject.code}
                  </span>
                  <h3 className="text-base font-black text-[#0B2C5C] mt-1">{selectedSubject.name}</h3>
                  <p className="text-xs text-slate-500">Monthly Attendance Calendar • August 2026</p>
                </div>
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 31-Day Interactive Grid */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div key={i} className="font-bold text-slate-400 text-[10px] py-1">{d}</div>
                ))}
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                  const log = calendarLogs[day];
                  const isPresent = log?.status === "PRESENT";
                  const isAbsent = log?.status === "ABSENT";
                  const isWeekend = day % 7 === 6 || day % 7 === 0;
                  const isSelected = selectedDate === day;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(day)}
                      className={`p-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? "ring-2 ring-[#0B2C5C] bg-[#EEF2F8]"
                          : isPresent
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : isAbsent
                          ? "bg-rose-50 text-[#EF4444] border border-rose-200"
                          : isWeekend
                          ? "bg-slate-50 text-slate-400"
                          : "bg-white border border-slate-200 text-slate-700"
                      }`}
                    >
                      <span>{day}</span>
                      <span className="text-[8px] mt-0.5 uppercase">
                        {isPresent ? "✓" : isAbsent ? "✕" : isWeekend ? "—" : "•"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Date Inspector Detail Card */}
              {calendarLogs[selectedDate] && (
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#0B2C5C]">
                      Telemetry for {selectedDate} August 2026:
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      calendarLogs[selectedDate].status === "PRESENT"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-rose-100 text-[#EF4444] border border-rose-300"
                    }`}>
                      {calendarLogs[selectedDate].status}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    Timestamp: <strong className="text-slate-800">{calendarLogs[selectedDate].timestamp}</strong> • Method: <strong className="text-[#0B2C5C]">{calendarLogs[selectedDate].method}</strong>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Room: {calendarLogs[selectedDate].room} • Match Confidence: {calendarLogs[selectedDate].confidence}%
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

