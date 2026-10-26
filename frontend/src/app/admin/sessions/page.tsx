"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/services/apiClient";
import { Loader2, Plus, X, Play } from "lucide-react";

export default function AdminSessionsPage() {
  const { token, user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [facultiesList, setFacultiesList] = useState<any[]>([]);

  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState(1);
  const [subject, setSubject] = useState("");
  const [faculty, setFaculty] = useState("");
  const [duration, setDuration] = useState(60);

  const fetchActiveSession = useCallback(async () => {
    try {
      const res = await apiClient.get<any>("/attendance-sessions/active");
      const data = res.data;
      if (data && Array.isArray(data) && data.length > 0) {
        const active = data.find((s: any) => s.status === "OPEN");
        setSession(active || null);
      } else {
        setSession(null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPastSessions = useCallback(async () => {
    try {
      const res = await apiClient.get<any>("/attendance-sessions/past");
      if (res.data) {
        setPastSessions(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Fetch initial form data and active/past sessions only when token is ready
  useEffect(() => {
    if (!token) return;

    Promise.all([
      apiClient.get<any>("/departments"),
      apiClient.get<any>("/subjects"),
      apiClient.get<any>("/users?role=FACULTY"),
    ]).then(([depsRes, subsRes, facsRes]) => {
      if (depsRes.data) setDepartmentsList(Array.isArray(depsRes.data) ? depsRes.data : []);
      if (subsRes.data) setSubjectsList(Array.isArray(subsRes.data) ? subsRes.data : []);
      if (facsRes.data) {
        const users = Array.isArray(facsRes.data) ? facsRes.data : (facsRes.data?.users || []);
        setFacultiesList(users);
      }
    });

    fetchActiveSession();
    fetchPastSessions();
  }, [token, fetchActiveSession, fetchPastSessions]);

  const startSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post<any>("/attendance-sessions/start", {
        departmentId: parseInt(department.toString()) || 1,
        semester: parseInt(semester.toString()),
        subjectId: parseInt(subject.toString()) || undefined,
        facultyId: parseInt(faculty.toString()) || undefined,
        durationMinutes: parseInt(duration.toString()) || 60,
      });

      if (res.data) {
        await fetchActiveSession();
        await fetchPastSessions();
        if (res.data.id) {
          localStorage.setItem("activeSessionId", String(res.data.id));
        }
        setError(null);
      } else {
        setError(res.error || "Failed to start session.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to start session.");
    }
  };

  const closeSession = async (id: string | number) => {
    try {
      const res = await apiClient.post<any>(`/attendance-sessions/${id}/close`, {});
      if (!res.error) {
        setSession(null);
        await fetchPastSessions();
      } else {
        setError(res.error || "Failed to close session.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to close session.");
    }
  };

  if (loading && !session) {
    return (
      <DashboardShell allowedRoles={["ADMIN", "FACULTY", "DEAN", "HOD", "ADMINISTRATOR"] as any}>
        <div className="p-12 flex justify-center items-center">
          <Loader2 className="animate-spin text-[#0B2C5C] w-8 h-8" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell allowedRoles={["ADMIN", "FACULTY", "DEAN", "HOD", "ADMINISTRATOR"] as any}>
      <div className="p-6 space-y-6">
        <PageHeader
          title="Attendance Sessions"
          subtitle="Start and close hardware/rfid attendance sessions."
        />
        {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}

        {session ? (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Active Session</h2>
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div><span className="font-semibold text-slate-500">ID:</span> {session.id}</div>
              <div><span className="font-semibold text-slate-500">Subject:</span> {session.courseName || session.subject || "N/A"}</div>
              <div><span className="font-semibold text-slate-500">Faculty:</span> {session.facultyName || session.faculty || "N/A"}</div>
              <div><span className="font-semibold text-slate-500">Department:</span> {session.departmentName || session.department || "N/A"}</div>
              <div><span className="font-semibold text-slate-500">Status:</span> <span className="text-emerald-600 font-bold">{session.status}</span></div>
              <div><span className="font-semibold text-slate-500">Start Time:</span> {new Date(session.startTime).toLocaleString()}</div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => closeSession(session.id)}
                className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                <X className="w-4 h-4" />
                <span>Close Session</span>
              </button>
              <button
                onClick={() => window.open('/live-attendance', '_blank')}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                <Play className="w-4 h-4" />
                <span>View Live Console</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={startSession} className="mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-lg space-y-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Start New Session</h2>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
              <select required value={department} onChange={e => setDepartment(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2">
                <option value="">Select Department</option>
                {departmentsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Semester</label>
              <input required type="number" min="1" max="8" value={semester} onChange={e => setSemester(Number(e.target.value))} className="w-full border border-slate-300 rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Subject (Code)</label>
              <select required value={subject} onChange={e => setSubject(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2">
                <option value="">Select Subject</option>
                {subjectsList
                  .filter(s => !faculty || String(s.facultyId) === String(faculty))
                  .map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Faculty</label>
              <select required value={faculty} onChange={e => setFaculty(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2">
                <option value="">Select Faculty</option>
                {facultiesList
                  .filter(f => {
                    if (user?.role === "FACULTY") {
                      return String(f.id) === String(user.id);
                    }
                    if (!subject) return true;
                    const selectedSubject = subjectsList.find(s => String(s.id) === String(subject));
                    if (selectedSubject && selectedSubject.facultyId) {
                      return String(selectedSubject.facultyId) === String(f.id);
                    }
                    return true;
                  })
                  .map(f => <option key={f.id} value={f.id}>{f.fullName} ({f.department?.name || "Faculty"})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Duration (minutes)</label>
              <input required type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full border border-slate-300 rounded px-3 py-2" />
            </div>

            <button type="submit" className="flex items-center space-x-2 bg-[#0B2C5C] hover:bg-[#082046] text-white px-4 py-2 rounded-lg transition-colors font-semibold w-full justify-center">
              <Plus className="w-4 h-4" />
              <span>Start Session</span>
            </button>
          </form>
        )}

        {/* Past Sessions Table */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8 overflow-x-auto">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Past Sessions</h2>
          {pastSessions.length === 0 ? (
            <p className="text-slate-500">No past sessions found.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 font-semibold text-slate-600">ID</th>
                  <th className="py-3 px-4 font-semibold text-slate-600">Course</th>
                  <th className="py-3 px-4 font-semibold text-slate-600">Faculty</th>
                  <th className="py-3 px-4 font-semibold text-slate-600">Date & Time</th>
                  <th className="py-3 px-4 font-semibold text-slate-600">Present</th>
                  <th className="py-3 px-4 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {pastSessions.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-700">{s.id}</td>
                    <td className="py-3 px-4 text-sm text-slate-700">{s.courseName || s.subjectName || "Session"} ({s.courseCode || s.subjectCode || "N/A"})</td>
                    <td className="py-3 px-4 text-sm text-slate-700">{s.facultyName || "Faculty"}</td>
                    <td className="py-3 px-4 text-sm text-slate-700">{new Date(s.sessionDate).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString()}</td>
                    <td className="py-3 px-4 text-sm text-slate-700 font-medium text-emerald-600">{s.presentCount ?? 0}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-slate-500">{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
