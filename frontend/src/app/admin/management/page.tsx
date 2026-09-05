"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { mockService } from "@/services/mockServices";
import { Student, Faculty, Course } from "@/services/mockData";
import {
  Users,
  BookOpen,
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

export default function AdminManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"students" | "faculty" | "courses">("students");
  const [searchTerm, setSearchTerm] = useState("");

  const [students, setStudents] = useState<Student[]>(() => mockService.getStudents());
  const [faculty, setFaculty] = useState<Faculty[]>(() => mockService.getFaculty());
  const [courses, setCourses] = useState<Course[]>(() => mockService.getCourses());

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // New Student form fields
  const [newRoll, setNewRoll] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDept, setNewDept] = useState("Electronics & Communication Engg");
  const [newRfid, setNewRfid] = useState("E2-44-55-66-77");

  useEffect(() => {
    const update = () => {
      setStudents(mockService.getStudents());
      setFaculty(mockService.getFaculty());
      setCourses(mockService.getCourses());
    };
    const unsubscribe = mockService.subscribe(update);
    return () => unsubscribe();
  }, []);

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    mockService.addStudent(
      {
        rollNo: newRoll || `202510${Math.floor(5000 + Math.random() * 900)}`,
        name: newName,
        email: newEmail,
        phone: newPhone || "9876543210",
        department: newDept,
        semester: 3,
        section: "A",
        rfidUid: newRfid || "E2-00-11-22-33",
        faceRegistered: true,
        status: "ACTIVE",
        parentName: "Guardian",
        parentPhone: "9876543219",
        address: "Anna University Campus, Chennai",
      },
      {
        user: user?.name || "Admin User",
        role: "ADMIN",
      }
    );
    setShowAddModal(false);
    setNewName("");
    setNewRoll("");
    setNewEmail("");
  };

  const handleDeleteStudent = (rollNo: string, name: string) => {
    if (confirm(`Are you sure you want to deactivate and remove student ${name} (${rollNo})?`)) {
      mockService.deleteStudent(rollNo, {
        user: user?.name || "Admin User",
        role: "ADMIN",
        reason: "Administrative de-enrollment",
      });
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell allowedRoles={["ADMIN"]}>
      <div className="space-y-6 font-sans text-slate-800">
        <PageHeader
          title="Institutional Records & Master Management"
          subtitle="Directory and CRUD operations for Students, Faculty staff, and Course curriculum with automatic audit logging"
          breadcrumb={[{ label: "Institutional Management" }]}
          categoryTag="UNIVERSITY REGISTRY & RECORDS"
          action={
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-xs shadow-md transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll New Student</span>
            </button>
          }
        />

        {/* Tab & Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E2E8F0] p-3.5 rounded-2xl shadow-xs">
          <div className="flex bg-[#F1F5F9] p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab("students")}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "students" ? "bg-white text-[#0B2C5C] shadow-xs" : "text-slate-600 hover:text-[#0B2C5C]"
              }`}
            >
              Students ({students.length})
            </button>
            <button
              onClick={() => setActiveTab("faculty")}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "faculty" ? "bg-white text-[#0B2C5C] shadow-xs" : "text-slate-600 hover:text-[#0B2C5C]"
              }`}
            >
              Faculty Staff ({faculty.length})
            </button>
            <button
              onClick={() => setActiveTab("courses")}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "courses" ? "bg-white text-[#0B2C5C] shadow-xs" : "text-slate-600 hover:text-[#0B2C5C]"
              }`}
            >
              Courses ({courses.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or roll number..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B2C5C]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* ================= TAB 1: STUDENTS TABLE ================= */}
        {activeTab === "students" && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEF2F8] text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-3.5">Roll Number</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">RFID UID</th>
                  <th className="p-3.5">Face Biometric</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.map((s) => (
                  <tr key={s.rollNo} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#0B2C5C]">{s.rollNo}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[10px] text-slate-500">{s.email}</div>
                    </td>
                    <td className="p-3.5 text-slate-600">{s.department}</td>
                    <td className="p-3.5 font-mono text-slate-600">{s.rfidUid}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ Enrolled
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleDeleteStudent(s.rollNo, s.name)}
                        className="p-1.5 rounded-lg text-[#EF4444] hover:bg-rose-50"
                        title="Remove Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TAB 2: FACULTY TABLE ================= */}
        {activeTab === "faculty" && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEF2F8] text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-3.5">Staff ID</th>
                  <th className="p-3.5">Faculty Name</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Designation</th>
                  <th className="p-3.5">Assigned Courses</th>
                  <th className="p-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {faculty.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#0B2C5C]">{f.id}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{f.name}</div>
                      <div className="text-[10px] text-slate-500">{f.email}</div>
                    </td>
                    <td className="p-3.5 text-slate-600">{f.department}</td>
                    <td className="p-3.5 font-semibold text-slate-700">{f.designation}</td>
                    <td className="p-3.5 font-mono text-slate-600">{f.assignedCourses.join(", ")}</td>
                    <td className="p-3.5 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Active Staff
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TAB 3: COURSES TABLE ================= */}
        {activeTab === "courses" && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEF2F8] text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-3.5">Course Code</th>
                  <th className="p-3.5">Course Title</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Credits</th>
                  <th className="p-3.5">Semester</th>
                  <th className="p-3.5 text-right">Total Sessions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {courses.map((c) => (
                  <tr key={c.code} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#0B2C5C]">{c.code}</td>
                    <td className="p-3.5 font-bold text-slate-900">{c.name}</td>
                    <td className="p-3.5 text-slate-600">{c.department}</td>
                    <td className="p-3.5 font-mono text-slate-700">{c.credits} Credits</td>
                    <td className="p-3.5">{c.semester}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-[#0B2C5C]">{c.credits * 15}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Enroll Student Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071E40]/60 backdrop-blur-xs p-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-[#0B2C5C]">Enroll New University Student</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2025105088"
                    value={newRoll}
                    onChange={(e) => setNewRoll(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Student full name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="student@annauniv.edu"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  >
                    <option value="Electronics & Communication Engg">Electronics & Communication Engg</option>
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">RFID UID Tag Number</label>
                  <input
                    type="text"
                    required
                    value={newRfid}
                    onChange={(e) => setNewRfid(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black shadow-md"
                  >
                    Commit Enrollment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
