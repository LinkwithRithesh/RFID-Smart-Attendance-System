"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/services/apiClient";
import { Loader2, Plus, Edit, Trash2, LayoutGrid, List, Clock } from "lucide-react";

export default function AdminTimetablePage() {
  const { token } = useAuth();
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
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
    fetchSlots();
    fetchMetadata();
  }, []); // Run once, apiClient handles tokens natively

  const fetchMetadata = async () => {
    try {
      const [deptRes, subjRes, facRes] = await Promise.all([
        apiClient.get("/departments"),
        apiClient.get("/subjects"),
        apiClient.get("/users?role=FACULTY&limit=100")
      ]);
      
      if(!deptRes.error && deptRes.data) setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
      if(!subjRes.error && subjRes.data) setSubjects(Array.isArray(subjRes.data) ? subjRes.data : []);
      if(!facRes.error && facRes.data) {
        setFaculties(facRes.data.users ? facRes.data.users : (Array.isArray(facRes.data) ? facRes.data : []));
      }
    } catch(e) {
      console.error(e);
    }
  };

  const fetchSlots = async () => {
    try {
      const res = await apiClient.get("/timetable");
      if (!res.error && res.data) {
        setSlots(Array.isArray(res.data) ? res.data : []);
      }
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
      

      let res;
      if (editId) {
        res = await apiClient.patch(`/timetable/${editId}`, payload);
      } else {
        res = await apiClient.post("/timetable", payload);
      }
      
      if(res.error) {
         alert(res.error || 'Failed to save timetable slot');
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
      await apiClient.delete(`/timetable/${id}`);
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

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader title="Timetable Management" subtitle="Add, edit, and delete timetable slots." />
        
        <div className="flex space-x-2">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center space-x-1">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md flex items-center transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`} title="List View">
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md flex items-center transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`} title="Grid View">
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button onClick={openAdd} className="flex items-center space-x-2 bg-[#0B2C5C] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#071E40] transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Slot</span>
          </button>
        </div>

      </div>

      
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

      {viewMode === "list" && (
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
                <td className="p-4 font-mono text-xs">
                  {s.startTime ? new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : ''} - {s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : ''}
                </td>
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
      )}

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
