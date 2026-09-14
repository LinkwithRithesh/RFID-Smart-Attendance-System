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
  Users,
  Edit
} from "lucide-react";

// Modal component for manual override
function OverrideModal({ session, student, onClose, onSave }: { session: any, student: any, onClose: () => void, onSave: (status: string) => void }) {
    const [status, setStatus] = useState("PRESENT");
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
                <h3 className="font-bold text-lg text-[#0B2C5C]">Manual Attendance Override</h3>
                <div className="text-sm text-slate-600">
                    <p><strong>Student:</strong> {student?.name} ({student?.rollNumber})</p>
                    <p><strong>Session:</strong> {session?.date} ({session?.type})</p>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Select Status</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={status} onChange={e => setStatus(e.target.value)}>
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                        <option value="LATE">Late</option>
                        <option value="EXCUSED">Excused</option>
                    </select>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800">Cancel</button>
                    <button onClick={() => onSave(status)} className="px-4 py-2 text-sm font-bold bg-[#0B2C5C] text-white rounded-xl">Save Override</button>
                </div>
            </div>
        </div>
    );
}

export default function AttendancePage() {
  const { user } = useAuth();
  const isFaculty = user?.role === "FACULTY" || user?.role === "ADMIN";
  const studentRoll = user?.userId || "2025105002";

  // If Faculty, they get choice of "my_attendance" or "student_attendance"
  const [facultyMode, setFacultyMode] = useState<"my_attendance" | "student_attendance">("student_attendance");
  
  const [activeTab, setActiveTab] = useState<"details" | "statement">("details");
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [overallStats, setOverallStats] = useState<any>(null);
  
  // Faculty specific states
  const [facultyCourses, setFacultyCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [courseSessions, setCourseSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [sessionAttendance, setSessionAttendance] = useState<any[]>([]);
  
  const [overrideData, setOverrideData] = useState<{session: any, student: any} | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!isFaculty || facultyMode === "my_attendance") {
        apiClient.get("/attendance/subjects").then(res => { if(mounted) setSubjects(res.data || []); });
        apiClient.get("/dashboard/student/stats").then(res => { if(mounted) setOverallStats(res.data); });
    }
    
    if (isFaculty && facultyMode === "student_attendance") {
        apiClient.get<any[]>("/dashboard/faculty/courses").then(res => {
            if(mounted && res.data) setFacultyCourses(res.data);
        });
    }
    return () => { mounted = false; };
  }, [studentRoll, isFaculty, facultyMode]);

  // When a faculty course is selected, fetch students and sessions
  useEffect(() => {
      if (selectedCourse) {
          apiClient.get(`/dashboard/faculty/subject/${selectedCourse.id}/students`).then(res => setCourseStudents(res.data || []));
          apiClient.get(`/dashboard/faculty/subject/${selectedCourse.id}/sessions`).then(res => setCourseSessions(res.data || []));
          setSelectedSession(null);
      }
  }, [selectedCourse]);

  // When a session is selected, fetch attendance records
  useEffect(() => {
      if (selectedSession) {
          apiClient.get(`/attendance/sessions/${selectedSession.id}`).then(res => setSessionAttendance(res.data || []));
      }
  }, [selectedSession]);

  const handleExportCourseStudents = () => {
      if (!courseStudents.length) return;
      const rows = [["Name", "Roll Number", "Email"]];
      courseStudents.forEach(s => rows.push([s.name, s.rollNumber, s.email]));
      const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `${selectedCourse?.code}_students.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleSaveOverride = async (status: string) => {
      if (!overrideData) return;
      try {
          await apiClient.post("/attendance/manual", {
              sessionId: overrideData.session.id,
              userId: overrideData.student.id,
              status: status
          });
          // Refresh session attendance
          const res = await apiClient.get(`/attendance/sessions/${overrideData.session.id}`);
          setSessionAttendance(res.data || []);
          setOverrideData(null);
          alert("Attendance successfully overridden.");
      } catch (err) {
          alert("Failed to override attendance.");
      }
  };

  // Selected subject for monthly calendar modal (for My Attendance)
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<number>(8);
  const [calendarLogs, setCalendarLogs] = useState<Record<number, any>>({});
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [semester, setSemester] = useState("Semester 3");
  const [statementSubject, setStatementSubject] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("2026-07-01");
  const [dateTo, setDateTo] = useState("2026-09-04");

  useEffect(() => {
    if (selectedSubject && (!isFaculty || facultyMode === "my_attendance")) {
      apiClient.get(`/attendance/calendar?subject=${selectedSubject.code}&studentId=${studentRoll}`)
        .then(res => {
          const logsObj: Record<number, any> = {};
          if (res.data && Array.isArray(res.data)) {
            res.data.forEach((r: any) => {
              const parts = r.date.split("-");
              const day = parts.length === 3 ? parseInt(parts[2], 10) : new Date(r.date).getDate();
              logsObj[day] = {
                status: r.status,
                timestamp: r.date,
                method: r.method,
                room: r.device || 'Classroom',
                confidence: r.confidence
              };
            });
          }
          setCalendarLogs(logsObj);
          const today = new Date().getDate();
          setSelectedDate(logsObj[today] ? today : 1);
        })
        .catch(() => setCalendarLogs({}));
    }
  }, [selectedSubject, studentRoll, isFaculty, facultyMode]);

  const handleExportCSV = async () => {
    const rows = [
      ["Course Code", "Subject Name", "Faculty", "Held", "Attended", "Absent", "Attendance %", "Status"],
      ...subjects.map((s) => [s.code, s.name, s.faculty, s.held, s.attended, s.absent, `${s.percentage}%`, s.status]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `smartattend_statement_${studentRoll}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = async () => {
    alert(`Generating official university stamped Attendance Statement PDF...`);
  };

  // --- RENDER HELPERS ---
  const renderFacultyStudentMode = () => {
      return (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Select Course */}
                  <div className="md:col-span-1 bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-4">
                      <h3 className="font-bold text-sm text-[#0B2C5C] uppercase tracking-wider">1. Select Assigned Course</h3>
                      <div className="space-y-2">
                          {facultyCourses.map(c => (
                              <button
                                  key={c.id}
                                  onClick={() => setSelectedCourse(c)}
                                  className={`w-full text-left p-3 rounded-xl border transition-all ${selectedCourse?.id === c.id ? 'border-[#0B2C5C] bg-[#EEF2F8] shadow-sm' : 'border-[#E2E8F0] hover:border-slate-300'}`}
                              >
                                  <div className="font-bold text-xs text-slate-900">{c.code}</div>
                                  <div className="text-xs text-slate-500 truncate">{c.name}</div>
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Course Details & Students */}
                  {selectedCourse && (
                      <div className="md:col-span-2 bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <h3 className="font-bold text-sm text-[#0B2C5C] uppercase tracking-wider">Course Enrollment: {selectedCourse.code}</h3>
                              <button onClick={handleExportCourseStudents} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center space-x-1 hover:bg-emerald-100">
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Export Student Roster</span>
                              </button>
                          </div>
                          <div className="flex space-x-6 text-sm font-mono text-[#0B2C5C]">
                              <div><strong>Enrolled:</strong> {courseStudents.length} Students</div>
                              <div><strong>Total Sessions:</strong> {courseSessions.length}</div>
                          </div>
                          
                          <div className="pt-2">
                              <h3 className="font-bold text-sm text-[#0B2C5C] uppercase tracking-wider mb-3">2. Select A Session to Review/Override</h3>
                              <div className="overflow-x-auto">
                                  <div className="flex space-x-3 pb-2">
                                      {courseSessions.map(session => (
                                          <button
                                              key={session.id}
                                              onClick={() => setSelectedSession(session)}
                                              className={`shrink-0 p-3 rounded-xl border text-left min-w-[150px] transition-all ${selectedSession?.id === session.id ? 'border-[#0B2C5C] bg-[#EEF2F8]' : 'border-[#E2E8F0] hover:bg-slate-50'}`}
                                          >
                                              <div className="text-xs font-bold text-slate-900">{session.date}</div>
                                              <div className="text-[10px] text-slate-500 font-mono mt-1">P: {session.present} / A: {session.absent}</div>
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          </div>

                          {selectedSession && (
                              <div className="pt-4 border-t border-slate-100 space-y-3">
                                  <h3 className="font-bold text-sm text-[#0B2C5C] uppercase tracking-wider">Session Roster & Overrides</h3>
                                  <div className="max-h-64 overflow-y-auto border border-[#E2E8F0] rounded-xl">
                                      <table className="w-full text-left text-xs">
                                          <thead className="bg-[#EEF2F8] sticky top-0">
                                              <tr>
                                                  <th className="p-2 font-bold text-slate-700">Student</th>
                                                  <th className="p-2 font-bold text-slate-700">Roll No</th>
                                                  <th className="p-2 font-bold text-slate-700">Status</th>
                                                  <th className="p-2 font-bold text-slate-700 text-right">Action</th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                              {courseStudents.map(student => {
                                                  // Find attendance record for this student
                                                  const record = sessionAttendance.find(r => r.userId === student.id);
                                                  const isPresent = record?.status === "PRESENT" || record?.status === "LATE";
                                                  
                                                  return (
                                                      <tr key={student.id} className="hover:bg-slate-50">
                                                          <td className="p-2 font-medium">{student.name}</td>
                                                          <td className="p-2 font-mono text-slate-500">{student.rollNumber}</td>
                                                          <td className="p-2">
                                                              {record ? (
                                                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                                      {record.status}
                                                                  </span>
                                                              ) : (
                                                                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-500">UNMARKED</span>
                                                              )}
                                                          </td>
                                                          <td className="p-2 text-right">
                                                              <button onClick={() => setOverrideData({session: selectedSession, student})} className="text-xs font-bold text-[#0B2C5C] bg-[#EEF2F8] px-2 py-1 rounded hover:bg-[#071E40] hover:text-white flex items-center justify-end ml-auto space-x-1">
                                                                  <Edit className="w-3 h-3" />
                                                                  <span>Override</span>
                                                              </button>
                                                          </td>
                                                      </tr>
                                                  );
                                              })}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // --- MY ATTENDANCE MODE (Original view) ---
  const renderFacultyPersonalAttendance = () => {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                    <div className="space-y-1">
                        <h3 className="font-extrabold text-lg text-[#0B2C5C]">Staff Daily Attendance Checkpoints</h3>
                        <p className="text-xs font-mono text-slate-500">Track your daily mandatory check-ins and check-outs.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-black text-emerald-600">Today: {new Date().toLocaleDateString()}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Morning Check-in */}
                    <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="font-bold text-sm text-slate-900">Morning Check-in</div>
                            <span className="px-2 py-1 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">COMPLETED</span>
                        </div>
                        <div className="text-xs text-slate-500">Before 1st Hour (09:00 AM)</div>
                        <div className="text-sm font-mono font-bold text-[#0B2C5C] pt-2">Scanned at 08:45 AM</div>
                        <div className="text-[10px] text-slate-400">RFID Terminal: Main Block Gate</div>
                    </div>

                    {/* Post-Lunch Check-in */}
                    <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="font-bold text-sm text-slate-900">Post-Lunch Check-in</div>
                            <span className="px-2 py-1 rounded text-[10px] font-black bg-slate-200 text-slate-600">PENDING</span>
                        </div>
                        <div className="text-xs text-slate-500">Before 5th Hour (01:45 PM)</div>
                        <div className="text-sm font-mono font-bold text-slate-400 pt-2">--:--</div>
                        <div className="text-[10px] text-slate-400">Awaiting scan...</div>
                    </div>

                    {/* Evening Check-out */}
                    <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="font-bold text-sm text-slate-900">Evening Check-out</div>
                            <span className="px-2 py-1 rounded text-[10px] font-black bg-slate-200 text-slate-600">PENDING</span>
                        </div>
                        <div className="text-xs text-slate-500">After Last Hour (04:30 PM)</div>
                        <div className="text-sm font-mono font-bold text-slate-400 pt-2">--:--</div>
                        <div className="text-[10px] text-slate-400">Awaiting scan...</div>
                    </div>
                </div>

                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 leading-relaxed font-medium">
                    <p><strong>Note:</strong> Faculty members are required to log their attendance at the three designated checkpoints daily. Missing a checkpoint may require HOD approval for regularization.</p>
                </div>
            </div>
            
            {/* Faculty Monthly Calendar */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <h3 className="text-sm font-extrabold text-[#0B2C5C] uppercase tracking-tight">Your Attendance Calendar</h3>
                    <div className="flex items-center space-x-4">
                        <button className="p-1 hover:bg-slate-100 rounded">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-slate-700">September 2026</span>
                        <button className="p-1 hover:bg-slate-100 rounded">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                        <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase py-2">{day}</div>
                    ))}
                    {/* Dummy padding for calendar start */}
                    <div className="aspect-square rounded-xl bg-transparent" />
                    <div className="aspect-square rounded-xl bg-transparent" />
                    
                    {Array.from({length: 30}).map((_, i) => {
                        const date = i + 1;
                        const isWeekend = (date + 2) % 7 === 0 || (date + 2) % 7 === 6; // Rough math for September 2026
                        const isPresent = date <= 14 && !isWeekend;
                        const isToday = date === 14;
                        
                        return (
                            <div key={date} className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all ${
                                isToday ? 'border-[#0B2C5C] bg-[#EEF2F8] ring-2 ring-[#0B2C5C]/20' :
                                isWeekend ? 'bg-slate-50 border-transparent text-slate-400' :
                                isPresent ? 'border-emerald-200 bg-emerald-50 text-emerald-800' :
                                'border-slate-100 hover:border-slate-300 text-slate-700'
                            }`}>
                                <span className="text-sm font-bold">{date}</span>
                                {isPresent && !isToday && <span className="text-[8px] font-black uppercase text-emerald-600 mt-0.5">PRESENT</span>}
                                {isWeekend && <span className="text-[8px] font-black uppercase text-slate-400 mt-0.5">HOLIDAY</span>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
  };

  const renderMyAttendance = () => {
    if (isFaculty) return renderFacultyPersonalAttendance();
    return (
        <div className="space-y-6">
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

            {activeTab === "details" ? (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {subjects.map((s) => {
                    const isShortage = s.status === "SHORTAGE";
                    const isWarning = s.status === "WARNING";
                    return (
                    <div key={s.code} className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-4 hover-lift">
                        <div className="flex items-start justify-between">
                        <div>
                            <span className="font-mono text-xs font-bold text-[#0B2C5C] bg-[#EEF2F8] px-2 py-0.5 rounded">{s.code}</span>
                            <h3 className="font-extrabold text-sm text-slate-900 mt-1.5">{s.name}</h3>
                            <p className="text-xs text-slate-500 font-medium">{s.faculty}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black font-mono text-[#0B2C5C]">{s.percentage}%</div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase mt-1 ${isShortage ? "bg-rose-100 text-[#EF4444] border border-rose-300" : isWarning ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-emerald-100 text-emerald-800 border border-emerald-300"}`}>
                            {s.status}
                            </span>
                        </div>
                        </div>
                        <div className="w-full bg-[#EEF2F8] h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${isShortage ? "bg-[#EF4444]" : isWarning ? "bg-amber-500" : "bg-[#0B2C5C]"}`} style={{ width: `${s.percentage}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-xs pt-1">
                        <div className="flex space-x-3 font-mono">
                            <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Held</span><span className="font-bold text-slate-700">{s.held}</span></div>
                            <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Attended</span><span className="font-bold text-emerald-600">{s.attended}</span></div>
                            <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Absent</span><span className="font-bold text-[#EF4444]">{s.absent}</span></div>
                        </div>
                        <button onClick={() => setSelectedSubject(s)} className="text-[#0B2C5C] hover:text-[#071E40] bg-[#EEF2F8] hover:bg-[#E2E8F0] p-1.5 rounded-lg transition-colors" title="View Month Calendar">
                            <CalendarCheck className="w-4 h-4" />
                        </button>
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>
            ) : (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <ShieldCheck className="w-64 h-64 text-[#0B2C5C]" />
                </div>
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 relative z-10">
                <div className="space-y-1">
                    <h3 className="font-extrabold text-lg text-[#0B2C5C]">Official Attendance Statement</h3>
                    <p className="text-xs font-mono text-slate-500">Roll No: {studentRoll} • Generated: {new Date().toLocaleDateString()}</p>
                </div>
                </div>
                <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left text-xs">
                    <thead className="bg-[#EEF2F8] text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                    <tr><th className="p-3">Course Code</th><th className="p-3">Subject Name</th><th className="p-3">Total Held</th><th className="p-3">Attended</th><th className="p-3">Absent</th><th className="p-3">Attendance %</th><th className="p-3">Eligibility</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {subjects.map((s, idx) => {
                        const isShortage = s.status === "SHORTAGE";
                        const isWarning = s.status === "WARNING";
                        return (
                        <tr key={idx} className="hover:bg-slate-50 font-medium">
                            <td className="p-3 font-mono font-bold text-[#0B2C5C]">{s.code}</td>
                            <td className="p-3 text-slate-900">{s.name}</td>
                            <td className="p-3 font-mono">{s.held}</td>
                            <td className="p-3 font-mono text-emerald-600">{s.attended}</td>
                            <td className="p-3 font-mono text-[#EF4444]">{s.absent}</td>
                            <td className="p-3 font-mono font-black text-[#0B2C5C]">{s.percentage}%</td>
                            <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${isShortage ? "bg-rose-100 text-[#EF4444]" : isWarning ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{s.status}</span></td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
                </div>
                <div className="mt-4 p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[11px] text-slate-600 leading-relaxed font-medium relative z-10">
                <p><strong>Note:</strong> This is a digitally verified statement from the SmartAttend framework. A minimum of 75% attendance per subject is mandatory for end-semester examination eligibility as per university regulations. Anomalies reported must be contested within 72 hours via the Helpdesk.</p>
                </div>
            </div>
            )}
        </div>
    );
  };


  return (
    <DashboardShell>
      <div className="space-y-6 font-sans text-slate-800">
        <PageHeader
          title={isFaculty ? "Attendance Verification & Overrides" : "Attendance Management & Verification"}
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

        {isFaculty && (
            <div className="flex items-center space-x-2 bg-white border border-[#E2E8F0] p-1.5 rounded-2xl shadow-xs w-fit mb-4">
                <button
                    onClick={() => setFacultyMode("student_attendance")}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${facultyMode === "student_attendance" ? "bg-[#0B2C5C] text-white shadow-xs" : "text-slate-600 hover:text-[#0B2C5C]"}`}
                >
                    <div className="flex items-center space-x-1.5">
                        <Users className="w-4 h-4" />
                        <span>Student Attendance & Overrides</span>
                    </div>
                </button>
                <button
                    onClick={() => setFacultyMode("my_attendance")}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${facultyMode === "my_attendance" ? "bg-[#0B2C5C] text-white shadow-xs" : "text-slate-600 hover:text-[#0B2C5C]"}`}
                >
                    <div className="flex items-center space-x-1.5">
                        <ScanFace className="w-4 h-4" />
                        <span>My Personal Attendance</span>
                    </div>
                </button>
            </div>
        )}

        {isFaculty && facultyMode === "student_attendance" ? renderFacultyStudentMode() : renderMyAttendance()}

      </div>
      
      {overrideData && (
          <OverrideModal 
            session={overrideData.session} 
            student={overrideData.student} 
            onClose={() => setOverrideData(null)}
            onSave={handleSaveOverride}
          />
      )}
    </DashboardShell>
  );
}
