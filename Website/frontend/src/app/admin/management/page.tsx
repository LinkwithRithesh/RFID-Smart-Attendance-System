"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { api, StudentRow } from "@/services/api";
import { mockService } from "@/services/mockServices";
import { Faculty, Course } from "@/services/mockData";
import {
  Users,
  BookOpen,
  Building2,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface DepartmentOption {
  id: number;
  name: string;
  code: string;
}

interface CourseOption {
  id: number;
  code: string;
  name: string;
  departmentId?: number;
}

export default function AdminManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"students" | "faculty" | "courses">("students");
  const [searchTerm, setSearchTerm] = useState("");

  // Real Students State
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentError, setStudentError] = useState<string | null>(null);

  // Mock Faculty & Courses (Untouched)
  const [faculty, setFaculty] = useState<Faculty[]>(() => mockService.getFaculty());
  const [courses, setCourses] = useState<Course[]>(() => mockService.getCourses());

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Departments and Courses for Enrollment Form
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [deptCourses, setDeptCourses] = useState<CourseOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Enrollment Form Fields
  const [newRoll, setNewRoll] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDeptId, setNewDeptId] = useState<number | "">("");
  const [newCourseId, setNewCourseId] = useState<number | "">("");
  const [newSemester, setNewSemester] = useState(1);
  const [newAdmissionYear, setNewAdmissionYear] = useState(new Date().getFullYear());
  const [newRfid, setNewRfid] = useState("");

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    setStudentError(null);
    try {
      const res = await api.getStudents();
      setStudents(res.data);
    } catch (err: any) {
      console.error("Failed to load students:", err);
      setStudentError(err.message || "Failed to load students from server");
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Sync mock faculty and courses subscriptions
  useEffect(() => {
    const update = () => {
      setFaculty(mockService.getFaculty());
      setCourses(mockService.getCourses());
    };
    const unsubscribe = mockService.subscribe(update);
    return () => unsubscribe();
  }, []);

  // Fetch departments when modal opens
  useEffect(() => {
    if (!showAddModal) return;

    let mounted = true;
    async function fetchDepartments() {
      setLoadingOptions(true);
      setFormError(null);
      try {
        const res = await api.getDepartments();
        if (mounted) {
          setDepartments(res.data);
          if (res.data.length > 0) {
            setNewDeptId(res.data[0].id);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setFormError(err.message || "Failed to load departments");
        }
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    }

    fetchDepartments();
    return () => {
      mounted = false;
    };
  }, [showAddModal]);

  // Fetch courses when selected department changes
  useEffect(() => {
    if (!showAddModal || !newDeptId) {
      setDeptCourses([]);
      setNewCourseId("");
      return;
    }

    let mounted = true;
    async function fetchCourses() {
      try {
        const res = await api.getCoursesByDepartment(Number(newDeptId));
        if (mounted) {
          setDeptCourses(res.data);
          if (res.data.length > 0) {
            setNewCourseId(res.data[0].id);
          } else {
            setNewCourseId("");
          }
        }
      } catch (err: any) {
        if (mounted) {
          console.error("Failed to load courses:", err);
          setDeptCourses([]);
          setNewCourseId("");
        }
      }
    }

    fetchCourses();
    return () => {
      mounted = false;
    };
  }, [showAddModal, newDeptId]);

  const handleOpenAddModal = () => {
    setNewRoll("");
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewRfid("");
    setNewSemester(1);
    setNewAdmissionYear(new Date().getFullYear());
    setFormError(null);
    setShowAddModal(true);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newPassword || newPassword.length < 8) {
      setFormError("Password is required and must be at least 8 characters.");
      return;
    }

    if (!newDeptId) {
      setFormError("Please select a department.");
      return;
    }

    if (!newCourseId) {
      setFormError("Please select a course/programme.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createUser({
        fullName: newName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        departmentId: Number(newDeptId),
        rfidCardId: newRfid.trim() || undefined,
        role: "STUDENT",
        profile: {
          rollNumber: newRoll.trim(),
          courseId: Number(newCourseId),
          currentSemester: Number(newSemester),
          admissionYear: Number(newAdmissionYear),
        },
      });

      setShowAddModal(false);
      await loadStudents();
    } catch (err: any) {
      console.error("Enrollment failed:", err);
      setFormError(err.message || "Failed to enroll student. Please check the form data.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: number, name: string, rollNumber: string) => {
    if (confirm(`Are you sure you want to deactivate student ${name} (${rollNumber})?`)) {
      try {
        await api.deleteUser(id);
        await loadStudents();
      } catch (err: any) {
        console.error("Failed to deactivate student:", err);
        setStudentError(err.message || `Failed to deactivate student ${name}`);
      }
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
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
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-xs shadow-md transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll New Student</span>
            </button>
          }
        />

        {studentError && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{studentError}</span>
            </div>
            <button
              onClick={() => loadStudents()}
              className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-bold"
            >
              Retry
            </button>
          </div>
        )}

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
              placeholder="Search by name, roll no, or dept..."
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
                {loadingStudents ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin text-[#0B2C5C]" />
                        <span className="font-semibold">Loading student directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#0B2C5C]">{s.rollNumber}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{s.fullName}</div>
                        <div className="text-[10px] text-slate-500">{s.email}</div>
                      </td>
                      <td className="p-3.5 text-slate-600">{s.departmentName}</td>
                      <td className="p-3.5 font-mono text-slate-600">
                        {s.rfidCardId ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {s.rfidCardId}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not Registered</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {s.hasFaceEmbedding ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Enrolled
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Not Registered
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleDeleteStudent(s.id, s.fullName, s.rollNumber)}
                          className="p-1.5 rounded-lg text-[#EF4444] hover:bg-rose-50 transition-colors"
                          title="Deactivate Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071E40]/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4 text-slate-800 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-[#0B2C5C]">Enroll New University Student</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold"
                  type="button"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleAddStudent} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Roll Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2025105088"
                      value={newRoll}
                      onChange={(e) => setNewRoll(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800 focus:outline-none focus:border-[#0B2C5C]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Student full name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#0B2C5C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@annauniv.edu"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#0B2C5C]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#0B2C5C]"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Set a temporary password the student must change after first login.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Department *</label>
                    {loadingOptions ? (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400">
                        Loading departments...
                      </div>
                    ) : (
                      <select
                        required
                        value={newDeptId}
                        onChange={(e) => setNewDeptId(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#0B2C5C]"
                      >
                        {departments.length === 0 ? (
                          <option value="">No departments available</option>
                        ) : (
                          departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.code})
                            </option>
                          ))
                        )}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Programme / Course *</label>
                    <select
                      required
                      disabled={deptCourses.length === 0}
                      value={newCourseId}
                      onChange={(e) => setNewCourseId(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#0B2C5C] disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {deptCourses.length === 0 ? (
                        <option value="">No courses found — add courses first</option>
                      ) : (
                        deptCourses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} - {c.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Current Semester *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={12}
                      value={newSemester}
                      onChange={(e) => setNewSemester(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#0B2C5C]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Admission Year *</label>
                    <input
                      type="number"
                      required
                      min={2000}
                      max={2100}
                      value={newAdmissionYear}
                      onChange={(e) => setNewAdmissionYear(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#0B2C5C]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">RFID UID Tag (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 8976625E"
                      value={newRfid}
                      onChange={(e) => setNewRfid(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800 focus:outline-none focus:border-[#0B2C5C]"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || deptCourses.length === 0}
                    className="px-5 py-2 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{submitting ? "Enrolling..." : "Commit Enrollment"}</span>
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
