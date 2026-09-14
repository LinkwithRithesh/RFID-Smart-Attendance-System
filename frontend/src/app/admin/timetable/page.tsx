"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";

export default function AdminTimetablePage() {
  const { token } = useAuth();
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Metadata state
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  
  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState("MON");
  const [periodNumber, setPeriodNumber] = useState(1);
  const [subjectId, setSubjectId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [semester, setSemester] = useState(1);

  useEffect(() => {
    if (token) {
      fetchSlots();
      fetchMetadata();
    }
  }, [token]);

  const fetchMetadata = async () => {
    try {
      const [deptRes, subjRes, facRes] = await Promise.all([
        fetch("http://localhost:5000/api/v1/departments", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/v1/subjects", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/v1/users?role=FACULTY&limit=100", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const depts = await deptRes.json();
      const subjs = await subjRes.json();
      const facs = await facRes.json();
      if(depts.success) setDepartments(depts.data);
      if(subjs.success) setSubjects(subjs.data);
      if(facs.success) setFaculties(facs.data.users || facs.data);
    } catch(e) {
      console.error(e);
    }
  };

  const fetchSlots = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/v1/timetable", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setSlots(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodTimes = (period: number) => {
    const times: Record<number, { start: string, end: string }> = {
      1: { start: "08:30:00", end: "09:20:00" },
      2: { start: "09:20:00", end: "10:10:00" },
      3: { start: "10:30:00", end: "11:20:00" },
      4: { start: "11:20:00", end: "12:10:00" },
      5: { start: "13:00:00", end: "13:50:00" },
      6: { start: "13:50:00", end: "14:40:00" },
      7: { start: "14:40:00", end: "15:30:00" },
      8: { start: "15:30:00", end: "16:20:00" }
    };
    return times[period] || times[1];
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const times = getPeriodTimes(Number(periodNumber));
    
    const payload = {
      dayOfWeek,
      subjectId: Number(subjectId),
      facultyId: Number(facultyId),
      departmentId: Number(departmentId),
      roomNumber: roomId, // maps to roomNumber backend field
      semester: Number(semester),
      startTime: times.start,
      endTime: times.end,
      academicYear: "2026-2027" // hardcoded current year for now
    };
    
    try {
      const url = editId 
        ? `http://localhost:5000/api/v1/timetable/${editId}` 
        : "http://localhost:5000/api/v1/timetable";
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if(!res.ok) {
         alert(data.message || 'Failed to save timetable slot');
         return;
      }
      
      setShowModal(false);
      fetchSlots();
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slot?")) return;
    try {
      await fetch(`http://localhost:5000/api/v1/timetable/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSlots();
    } catch (err) {
      console.error(err);
    }
  };

  const openAdd = () => {
    setEditId(null);
    setDayOfWeek("MON");
    setPeriodNumber(1);
    setSubjectId("");
    setFacultyId("");
    setRoomId("");
    setDepartmentId("");
    setSemester(1);
    setShowModal(true);
  };

  const openEdit = (slot: any) => {
    setEditId(slot.id);
    setDayOfWeek(slot.dayOfWeek);
    
    // Reverse lookup period number from start time
    let period = 1;
    if(slot.startTime?.includes("09:20")) period = 2;
    if(slot.startTime?.includes("10:30")) period = 3;
    if(slot.startTime?.includes("11:20")) period = 4;
    if(slot.startTime?.includes("13:00")) period = 5;
    if(slot.startTime?.includes("13:50")) period = 6;
    if(slot.startTime?.includes("14:40")) period = 7;
    if(slot.startTime?.includes("15:30")) period = 8;
    setPeriodNumber(period);
    
    setSubjectId(slot.subjectId || "");
    setFacultyId(slot.facultyId || "");
    setRoomId(slot.roomNumber || "");
    setDepartmentId(slot.departmentId || "");
    setSemester(slot.semester || 1);
    setShowModal(true);
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader title="Timetable Management" subtitle="Add, edit, and delete timetable slots." />
        <button onClick={openAdd} className="flex items-center space-x-2 bg-[#0B2C5C] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#071E40] transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Slot</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-4">Day</th>
              <th className="p-4">Period</th>
              <th className="p-4">Dept / Sem</th>
              <th className="p-4">Subject</th>
              <th className="p-4">Faculty</th>
              <th className="p-4">Room</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slots.map((s: any) => {
              const dept = departments.find(d => d.id === s.departmentId);
              const subj = subjects.find(sub => sub.id === s.subjectId);
              const fac = faculties.find(f => f.id === s.facultyId);
              return (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="p-4">{s.dayOfWeek}</td>
                <td className="p-4 font-mono text-xs">{s.startTime?.substring(0,5)} - {s.endTime?.substring(0,5)}</td>
                <td className="p-4">{dept ? dept.code : s.departmentId} - S{s.semester}</td>
                <td className="p-4">
                  <div className="font-bold text-[#0B2C5C]">{subj ? subj.code : s.subjectId}</div>
                  <div className="text-xs text-slate-500">{subj ? subj.name : ""}</div>
                </td>
                <td className="p-4">{fac ? fac.fullName : s.facultyId}</td>
                <td className="p-4">{s.roomNumber || "N/A"}</td>
                <td className="p-4 flex space-x-2">
                  <button onClick={() => openEdit(s)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            )})}
            {slots.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">No timetable slots found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold">{editId ? "Edit" : "Add"} Timetable Slot</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Day</label>
                  <select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} className="w-full border rounded px-3 py-2">
                    {["MON","TUE","WED","THU","FRI","SAT","SUN"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Period (1-8)</label>
                  <select value={periodNumber} onChange={e => setPeriodNumber(Number(e.target.value))} className="w-full border rounded px-3 py-2" required>
                    {[1,2,3,4,5,6,7,8].map(p => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Department</label>
                  <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} className="w-full border rounded px-3 py-2" required>
                    <option value="">Select Dept</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Semester</label>
                  <input type="number" min="1" max="8" value={semester} onChange={e => setSemester(Number(e.target.value))} className="w-full border rounded px-3 py-2" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Subject</label>
                <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full border rounded px-3 py-2" required>
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-1">Faculty</label>
                <select value={facultyId} onChange={e => setFacultyId(e.target.value)} className="w-full border rounded px-3 py-2" required>
                  <option value="">Select Faculty</option>
                  {faculties.map(f => (
                    <option key={f.id} value={f.id}>{f.fullName} ({f.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Room ID/Code</label>
                <input type="text" value={roomId} onChange={e => setRoomId(e.target.value)} className="w-full border rounded px-3 py-2" />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold text-white bg-[#0B2C5C] rounded-lg hover:bg-[#082046]">Save Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
