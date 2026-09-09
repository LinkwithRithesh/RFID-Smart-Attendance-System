"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Loader } from "@/components/common/Loader";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/services/apiClient";
import Link from "next/link";

import {
  CalendarCheck,
  ClipboardCheck,
  Radio,
  ScanFace,
  Clock,
  BookOpen,
  Users,
  CheckCircle2,
  XCircle,
  Play,
  Cpu,
  TrendingUp,
  Flame,
  Award,
  ChevronRight,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// -------------------------------------------------------------
// 1. STUDENT DASHBOARD VIEW (Light Institutional Theme)
// -------------------------------------------------------------
function StudentDashboard() {
  const { user } = useAuth();
  const studentRoll = user?.userId || "";
  const studentName = user?.name || "";
  const department = user?.department || "";


  
  const [stats, setStats] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiClient.get("/dashboard/student/stats").then(r => mounted && setStats(r.data)),
      apiClient.get("/attendance/summary").then(r => mounted && setSubjects(r.data?.subjects || []))
    ]).finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [studentRoll]);


  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
apiClient.get<any[]>("/dashboard/student/today")
      .then(res => { if (res.data && Array.isArray(res.data)) setTodayClasses(res.data); })
      .catch(() => {});

    apiClient.get<any[]>("/dashboard/student/trend")
      .then(res => { if (res.data && Array.isArray(res.data)) setTrendData(res.data); })
      .catch(() => {});

    
  }, [studentRoll]);


  return (
    <div className="space-y-6 font-sans">
      {/* Institutional Department Banner */}
      <PageHeader
        title={`Welcome back, ${studentName}`}
        subtitle={`Roll No: ${studentRoll} â€¢ ${department} â€¢ Academic Year 2026â€“2027 (Semester 3)`}
        breadcrumb={[{ label: "Student Dashboard" }]}
        categoryTag="STUDENT ATTENDANCE CONSOLE"
        action={
          <Link
            href="/od-requests"
            className="px-5 py-2.5 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-xs shadow-md transition-all flex items-center space-x-1.5"
          >
            <span>Apply OD / Leave</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      />

      {/* 4 Attendance Stat Cards (White Surface with Soft Shadow) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ring Attendance Metric */}
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-between hover-lift">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overall Attendance</div>
            <div className="text-3xl font-black text-[#0B2C5C] mt-1 font-mono">{stats.overallPercentage}%</div>
            <div className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Compliant (&gt;75% required)</span>
            </div>
          </div>
          {/* Animated SVG Progress Ring */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="26" stroke="#EEF2F8" strokeWidth="6" fill="transparent" />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="#0B2C5C"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={163}
                strokeDashoffset={163 * (1 - stats.overallPercentage / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out animate-stroke-draw"
                style={{
                  transition: "stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </svg>
            <span className="absolute text-xs font-black text-[#0B2C5C] font-mono">{stats.overallPercentage}%</span>
          </div>
        </div>

        {/* Classes Attended Metric */}
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-2 hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Classes Attended</span>
            <div className="w-8 h-8 rounded-lg bg-[#EEF2F8] text-[#0B2C5C] flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#0B2C5C] font-mono">
            {stats.totalAttended} <span className="text-sm font-bold text-slate-400">/ {stats.totalHeld}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {stats.totalAbsent} absences recorded this term
          </div>
        </div>

        {/* Attendance Streak Badge */}
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-2 hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attendance Streak</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 font-mono">
            {stats.attendanceStreak} Days <span className="text-xs font-bold text-slate-400">Streak</span>
          </div>
          <div className="text-[11px] text-amber-700 font-bold flex items-center space-x-1">
            <Award className="w-3.5 h-3.5" />
            <span>Perfect Attendance in August</span>
          </div>
        </div>

        {/* Risk Prediction Metric */}
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-2 hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">75% Shortage Risk</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
              LOW RISK
            </span>
          </div>
          <div className="text-2xl font-black text-[#0B2C5C] mt-1">
            Safe: <span className="text-emerald-600 font-mono">{stats.maxAllowedMisses}</span> Classes
          </div>
          <div className="text-[11px] text-slate-500">
            Can safely miss up to {stats.maxAllowedMisses} sessions while remaining above 75%.
          </div>
        </div>
      </div>

      {/* Attendance Trend Chart + Critical Shortage Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: 6-Week Attendance Trend Recharts */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#0B2C5C]" />
              <h3 className="text-sm font-extrabold text-[#0B2C5C] uppercase tracking-tight">
                6-Week Attendance Trend Graph
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-600 font-bold">+2.4% vs last week</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B2C5C" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0B2C5C" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="week" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} domain={[60, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "10px", fontSize: "12px", color: "#0B2C5C" }}
                />
                <Area type="monotone" dataKey="attendance" stroke="#0B2C5C" strokeWidth={3} fillOpacity={1} fill="url(#areaGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 5 cols: Subject Shortage Watchlist */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <h3 className="text-sm font-extrabold text-[#0B2C5C] uppercase tracking-tight">
              Subject Attendance Status
            </h3>
            <Link href="/attendance" className="text-xs text-[#0B2C5C] hover:underline font-bold">
              View Calendar â†’
            </Link>
          </div>

          <div className="space-y-2.5">
            {subjects.map((s) => (
              <div
                key={s.code}
                className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between"
              >
                <div>
                  <div className="font-extrabold text-slate-900 text-xs">{s.name}</div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {s.code} â€¢ {s.attended}/{s.held} attended
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black font-mono text-[#0B2C5C]">{s.percentage}%</div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      s.status === "SHORTAGE"
                        ? "bg-rose-100 text-[#EF4444] border border-rose-300"
                        : s.status === "WARNING"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Schedule Table with Color-Coded Left Borders */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#0B2C5C]" />
            <h3 className="text-sm font-extrabold text-[#0B2C5C] tracking-tight uppercase">
              Today&apos;s Live Class Schedule
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500 font-bold">
            08 September 2026 (Tuesday) â€¢ Semester 3
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EEF2F8] text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Period</th>
                <th className="p-3">Course Code & Subject</th>
                <th className="p-3">Faculty</th>
                <th className="p-3">Room</th>
                <th className="p-3">Timing</th>
                <th className="p-3">Verification Sensor</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {todayClasses.map((item, idx) => {
                const isPresent = item.status === "PRESENT";
                const isAbsent = item.status === "ABSENT";
                const borderAccent = isPresent
                  ? "border-l-4 border-l-emerald-500 bg-emerald-50/30"
                  : isAbsent
                  ? "border-l-4 border-l-[#EF4444] bg-rose-50/40"
                  : "border-l-4 border-l-amber-500 bg-amber-50/20";

                return (
                  <tr key={idx} className={`hover:bg-slate-50 transition-colors font-medium ${borderAccent}`}>
                    <td className="p-3 font-mono font-bold text-[#0B2C5C]">{item.period}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{item.subject}</div>
                      <div className="text-[10px] font-mono text-slate-500">{item.code}</div>
                    </td>
                    <td className="p-3">{item.faculty}</td>
                    <td className="p-3 font-mono font-semibold">{item.room}</td>
                    <td className="p-3 font-mono text-slate-600">{item.time}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-[#EEF2F8] text-[#0B2C5C] font-mono">
                        {item.method}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {isPresent ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          âœ“ VERIFIED PRESENT
                        </span>
                      ) : isAbsent ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-[#EF4444] border border-rose-300">
                          âœ• ABSENT
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                          â€¢ UPCOMING
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. FACULTY DASHBOARD VIEW (Light Institutional Theme)
// -------------------------------------------------------------
function FacultyDashboard() {
  const { user } = useAuth();
  const facultyName = user?.name ?? "";
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get<any[]>("/dashboard/faculty/courses")
      .then(res => { if (res.data && Array.isArray(res.data)) setCourses(res.data); })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title={`Welcome back, ${facultyName}`}
        subtitle={`${user?.department || "Academic Department"} â€¢ Faculty Console`}
        breadcrumb={[{ label: "Faculty Console" }]}
        categoryTag="FACULTY ACADEMIC CONSOLE"
        action={
          <Link
            href="/live-attendance"
            className="px-5 py-2.5 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-xs shadow-md transition-all flex items-center space-x-2"
          >
            <Radio className="w-4 h-4" />
            <span>Launch Live Session</span>
          </Link>
        }
      />


      {/* Active Live Session Card with Lab Photo Strip */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2">
            <Play className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-[#0B2C5C] tracking-tight uppercase">
              Current Active Class Session (Period 2)
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
            <span>LIVE SESSION ACTIVE â€¢ MQTT ESP32 ONLINE</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          {/* Lab/Classroom Photo Thumbnail */}
          <div className="md:col-span-3 rounded-xl overflow-hidden border border-[#E2E8F0] relative h-28 md:h-auto shadow-inner group">
            <img
              src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80"
              alt="Room 302 Lab"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071E40]/90 via-transparent to-transparent flex items-end p-2.5">
              <span className="text-[10px] font-mono font-bold text-white">Room 302 â€¢ IoT Lab</span>
            </div>
          </div>

          <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Active Course</div>
              <div className="text-sm font-extrabold text-[#0B2C5C] mt-0.5">CS3401 Algorithms & Data Structures</div>
              <div className="text-xs text-slate-500 font-mono">Room 302 â€¢ Block A</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Enrolled Students</div>
              <div className="text-2xl font-black text-[#0B2C5C] mt-0.5 font-mono">62</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Present / Absent</div>
              <div className="text-2xl font-black text-emerald-600 mt-0.5 font-mono">
                54 <span className="text-xs font-bold text-[#EF4444]">/ 8 Absent</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/live-attendance"
            className="px-4 py-2 rounded-full bg-[#0B2C5C] hover:bg-[#071E40] text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Open Realtime Swipe Stream</span>
          </Link>
          <Link
            href="/attendance"
            className="px-4 py-2 rounded-full bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0B2C5C] font-bold text-xs flex items-center space-x-1.5 shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>View Attendance Roster</span>
          </Link>
          <Link
            href="/od-requests"
            className="px-4 py-2 rounded-full bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center space-x-1.5 shadow-xs"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Review Pending ODs</span>
          </Link>
        </div>
      </div>

      {/* Faculty Assigned Courses with Classroom Image Strips */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h3 className="text-sm font-extrabold text-[#0B2C5C] tracking-tight uppercase">
            Assigned Semester Courses & Lecture Halls
          </h3>
          <span className="text-xs font-mono text-slate-500">3 Courses Assigned</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden group hover:border-[#0B2C5C] transition-all">
            <div className="h-28 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80"
                alt="CS3401 Lecture"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-white text-[#0B2C5C] font-mono text-[10px] font-bold shadow-xs">
                CS3401
              </div>
            </div>
            <div className="p-3.5 space-y-1">
              <div className="font-extrabold text-slate-900 text-xs">Algorithms & Data Structures</div>
              <div className="text-[11px] text-slate-500">Room 302 â€¢ Mon, Tue, Thu</div>
              <div className="flex justify-between items-center text-[10px] text-emerald-700 font-bold pt-1">
                <span>Attendance: 87.1%</span>
                <span className="text-slate-500">62 Enrolled</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden group hover:border-[#0B2C5C] transition-all">
            <div className="h-28 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80"
                alt="CS3411 Lab"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-white text-[#0B2C5C] font-mono text-[10px] font-bold shadow-xs">
                CS3411
              </div>
            </div>
            <div className="p-3.5 space-y-1">
              <div className="font-extrabold text-slate-900 text-xs">Data Structures Laboratory</div>
              <div className="text-[11px] text-slate-500">IoT Lab 2 â€¢ Wed, Fri</div>
              <div className="flex justify-between items-center text-[10px] text-emerald-700 font-bold pt-1">
                <span>Attendance: 93.4%</span>
                <span className="text-slate-500">62 Enrolled</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden group hover:border-[#0B2C5C] transition-all">
            <div className="h-28 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80"
                alt="CS3402 Seminar"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-white text-[#0B2C5C] font-mono text-[10px] font-bold shadow-xs">
                CS3402
              </div>
            </div>
            <div className="p-3.5 space-y-1">
              <div className="font-extrabold text-slate-900 text-xs">Object-Oriented Programming</div>
              <div className="text-[11px] text-slate-500">Room 304 â€¢ Tue, Thu</div>
              <div className="flex justify-between items-center text-[10px] text-emerald-700 font-bold pt-1">
                <span>Attendance: 85.8%</span>
                <span className="text-slate-500">58 Enrolled</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. ADMIN DASHBOARD VIEW (Light Institutional Theme)
// -------------------------------------------------------------
function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    devices: 0,
    onlineDevices: 0,
    todayAttendance: 0,
  });

  useEffect(() => {
    apiClient.get<any>("/dashboard/stats")
      .then((res) => {
        if (res.data) {
          setStats({
            students: res.data.students || 0,
            faculty: res.data.faculty || 0,
            devices: res.data.devices || 0,
            onlineDevices: res.data.onlineDevices || 0,
            todayAttendance: res.data.todayAttendance || 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="SmartAttend Central Administration"
        subtitle="Campus-wide IoT RFID gateway telemetry, AI vision nodes, and automated condonation auditing"
        breadcrumb={[{ label: "Institutional Control Center" }]}
        categoryTag="INSTITUTIONAL ERP CONTROL CENTER"
        action={
          <Link
            href="/devices"
            className="px-5 py-2.5 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-xs shadow-md transition-all flex items-center space-x-1.5"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Manage Hardware Fleet</span>
          </Link>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs hover-lift">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Enrolled Students</div>
          <div className="text-3xl font-black text-[#0B2C5C] mt-1 font-mono">{stats.students}</div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">Verified Student Profiles</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs hover-lift">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Faculty Members</div>
          <div className="text-3xl font-black text-[#0B2C5C] mt-1 font-mono">{stats.faculty}</div>
          <div className="text-[11px] text-slate-500 mt-1">All verified university staff</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs hover-lift">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ESP32 Fleet Hardware</div>
          <div className="text-3xl font-black text-[#0B2C5C] mt-1 font-mono">{stats.devices}</div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">{stats.onlineDevices} Online</div>
        </div>


        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs hover-lift">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Campus Turnout Rate</div>
          <div className="text-3xl font-black text-emerald-700 mt-1 font-mono">{stats.todayAttendance}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Realtime MQTT aggregation</div>
        </div>
      </div>

      {/* Quick Access Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
          <div className="font-extrabold text-sm text-[#0B2C5C]">Student & Faculty Master Records</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Create, update, and search enrolled student credentials, RFID card mappings, and faculty departmental assignments.
          </p>
          <Link
            href="/admin/management"
            className="inline-block px-4 py-2 rounded-full bg-[#0B2C5C] hover:bg-[#071E40] text-white font-bold text-xs shadow-xs"
          >
            Launch CRUD Management â†’
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
          <div className="font-extrabold text-sm text-[#0B2C5C]">ESP32 Fleet & Sensor Telemetry</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Monitor real-time MQTT turnstile pings, trigger acoustic buzzer tests, and issue remote reboot commands to classroom nodes.
          </p>
          <Link
            href="/devices"
            className="inline-block px-4 py-2 rounded-full bg-[#0B2C5C] hover:bg-[#071E40] text-white font-bold text-xs shadow-xs"
          >
            View Device Fleet â†’
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
          <div className="font-extrabold text-sm text-[#0B2C5C]">Immutable System Audit Logs</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Inspect verified tamper-proof audit trails for all manual attendance corrections, OD approvals, and device commands.
          </p>
          <Link
            href="/audit-logs"
            className="inline-block px-4 py-2 rounded-full bg-[#0B2C5C] hover:bg-[#071E40] text-white font-bold text-xs shadow-xs"
          >
            Review Audit Logs â†’
          </Link>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MAIN DASHBOARD ENTRY
// -------------------------------------------------------------
export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role || "STUDENT";

  return (
    <DashboardShell>
      {role === "ADMIN" ? (
        <AdminDashboard />
      ) : role === "FACULTY" ? (
        <FacultyDashboard />
      ) : (
        <StudentDashboard />
      )}
    </DashboardShell>
  );
}

