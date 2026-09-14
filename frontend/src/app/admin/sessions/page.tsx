"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Plus, X, Play } from "lucide-react";

export default function AdminSessionsPage() {
  const { token } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [facultiesList, setFacultiesList] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:5000/api/v1/departments', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.json()),
      fetch('http://localhost:5000/api/v1/subjects', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.json()),
      fetch('http://localhost:5000/api/v1/users?role=FACULTY', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.json())
    ]).then(([deps, subs, facs]) => {
      if (deps.success) setDepartmentsList(deps.data);
      if (subs.success) setSubjectsList(subs.data);
      if (facs.success) setFacultiesList(facs.data.users || []);
    });
  }, [token]);


  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState(1);
  const [subject, setSubject] = useState("");
  const [faculty, setFaculty] = useState("");
  const [duration, setDuration] = useState(60);

  useEffect(() => {
    fetchActiveSession();
  }, [token]);

  const fetchActiveSession = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/v1/attendance-sessions/active", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        const active = data.data.find((s: any) => s.status === "OPEN");
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
  };

  const startSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/v1/attendance-sessions/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          departmentId: parseInt(department.toString()) || 1,
          semester: parseInt(semester.toString()),
          subjectId: parseInt(subject.toString()) || undefined,
          facultyId: parseInt(faculty.toString()) || undefined,
          durationMinutes: parseInt(duration.toString()) || 60,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.data);
        localStorage.setItem("activeSessionId", data.data.id);
        setError(null);
      } else {
        setError(data.message || "Failed to start session.");
      }
    } catch (err) {
      setError("Failed to start session.");
    }
  };

  const closeSession = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/attendance-sessions/${id}/close`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSession(null);
      } else {
        setError("Failed to close session.");
      }
    } catch (err) {
      setError("Failed to close session.");
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
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
            <div><span className="font-semibold text-slate-500">Subject:</span> {session.subject}</div>
            <div><span className="font-semibold text-slate-500">Faculty:</span> {session.faculty}</div>
            <div><span className="font-semibold text-slate-500">Department:</span> {session.department}</div>
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
{subjectsList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
</select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Faculty</label>
            <select required value={faculty} onChange={e => setFaculty(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2">
<option value="">Select Faculty</option>
{facultiesList.map(f => <option key={f.id} value={f.id}>{f.fullName} ({f.department?.name || "Faculty"})</option>)}
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
    </div>
  );
}
