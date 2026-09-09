"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { api, StudentRow } from "@/services/api";
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
  Edit,
  Eye,
  Check,
  X,
  Clock,
  ShieldAlert,
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
  const [activeTab, setActiveTab] = useState<"students" | "faculty" | "courses" | "pending">("students");
  const [searchTerm, setSearchTerm] = useState("");

  // Real Students State
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentError, setStudentError] = useState<string | null>(null);

  const [faculty, setFaculty] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingFaculty, setLoadingFaculty] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Pending Registrations State
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [showPendingDetailModal, setShowPendingDetailModal] = useState(false);
  const [selectedPendingItem, setSelectedPendingItem] = useState<any>(null);

  // Approve / Reject Modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionPendingId, setActionPendingId] = useState<number | null>(null);

  const loadFaculty = useCallback(async () => {
    setLoadingFaculty(true);
    try {
      const res = await api.getUsers({ role: "FACULTY", limit: 1000 });
      if (res.success) setFaculty(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFaculty(false);
    }
  }, []);

  const loadCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const res = await api.getCoursesByDepartment();
      if (res.success) setCourses(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const loadPending = useCallback(async () => {
    setLoadingPending(true);
    try {
      const res = await api.getPendingRegistrations();
      if (res.success) setPendingUsers(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newMobile, setNewMobile] = useState("");
  const [newParentName, setNewParentName] = useState("");
  const [newParentMobile, setNewParentMobile] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editStudentId, setEditStudentId] = useState<number | null>(null);

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
    loadFaculty();
    loadCourses();
    loadPending();
  }, [loadStudents, loadFaculty, loadCourses, loadPending]);

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
    setNewMobile("");
    setNewParentName("");
    setNewParentMobile("");
    setNewAddress("");

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
        phone: newMobile.trim() || undefined,
        profile: {
          rollNumber: newRoll.trim(),
          courseId: Number(newCourseId),
          currentSemester: Number(newSemester),
          admissionYear: Number(newAdmissionYear),
          parentName: newParentName.trim() || undefined,
          parentPhone: newParentMobile.trim() || undefined,
          address: newAddress.trim() || undefined,
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

  const handleEditStudentClick = async (s: StudentRow) => {
    try {
      const res = await api.getUserProfile(s.id);
      if (res.success) {
        setEditStudentId(s.id);
        setNewName(res.data.fullName || "");
        setNewEmail(res.data.email || "");
        setNewMobile(res.data.phone || "");
        setNewRfid(res.data.rfidCardId || "");
        setNewRoll(res.data.profile?.rollNumber || "");
        setNewDeptId(res.data.departmentId || departments[0]?.id || 1);
        setNewCourseId(res.data.profile?.courseId || deptCourses[0]?.id || 1);
        setNewSemester(res.data.profile?.currentSemester || 1);
        setNewAdmissionYear(res.data.profile?.admissionYear || new Date().getFullYear());
        setNewParentName(res.data.profile?.parentName || "");
        setNewParentMobile(res.data.profile?.parentPhone || "");
        setNewAddress(res.data.profile?.address || "");
        setFormError(null);
        setShowEditModal(true);
      }
    } catch (e: any) {
      alert("Failed to load student details");
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!editStudentId) return;

    setSubmitting(true);
    try {
      await api.updateUserProfile(editStudentId, {
        phone: newMobile.trim() || undefined,
        email: newEmail.trim() || undefined,
        parentName: newParentName.trim() || undefined,
        parentPhone: newParentMobile.trim() || undefined,
        address: newAddress.trim() || undefined,
      });

      await api.updateUser(editStudentId, {
        name: newName.trim(),
        rfidTag: newRfid.trim() || undefined,
        status: "ACTIVE",
      });

      setShowEditModal(false);
      await loadStudents();
    } catch (err: any) {
      setFormError(err.message || "Failed to update student.");
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

  // Pending Actions
  const handleApproveRegistration = async (id: number) => {
    if (confirm("Approve this self-registration application? Account will be set to APPROVED.")) {
      setSubmitting(true);
      try {
        await api.approveRegistration(id);
        await loadPending();
        await loadStudents();
        await loadFaculty();
        setShowPendingDetailModal(false);
      } catch (err: any) {
        alert(err.message || "Failed to approve registration");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleOpenRejectModal = (id: number) => {
    setActionPendingId(id);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionPendingId) return;

    setSubmitting(true);
    try {
      await api.rejectRegistration(actionPendingId, rejectReason.trim() || undefined);
      await loadPending();
      setShowRejectModal(false);
      setShowPendingDetailModal(false);
      setActionPendingId(null);
      setRejectReason("");
    } catch (err: any) {
      alert(err.message || "Failed to reject registration");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPending = pendingUsers.filter(
    (p) =>
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.registrationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell allowedRoles={["ADMIN"]}>
      <div className="space-y-6 font-sans text-slate-800">
        <PageHeader
          title="Institutional Records & Master Management"
          subtitle="Directory and CRUD operations for Students, Faculty staff, Course curriculum, and Self-Registration approvals"
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
          <div className="flex bg-[#F1F5F9] p-1 rounded-xl text-xs font-bold flex-wrap gap-1">
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
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === "pending"
                  ? "bg-[#0B2C5C] text-white shadow-xs"
                  : "text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Registrations ({pendingUsers.length})</span>
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
                        <button
                          onClick={() => handleEditStudentClick(s)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Student"
                        >
                          <Edit className="w-4 h-4" />
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
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {faculty.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#0B2C5C]">{f.userId || `FAC-${f.id}`}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{f.name}</div>
                      <div className="text-[10px] text-slate-500">{f.email}</div>
                    </td>
                    <td className="p-3.5 text-slate-600">{f.departmentName || f.department?.name || "General"}</td>
                    <td className="p-3.5 font-semibold text-slate-700">{f.designation || "Assistant Professor"}</td>
                    <td className="p-3.5">
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
                    <td className="p-3.5 text-slate-600">{c.department?.name || c.departmentName || "General"}</td>
                    <td className="p-3.5 font-mono text-slate-700">{c.credits || 3} Credits</td>
                    <td className="p-3.5">{c.semester || 1}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-[#0B2C5C]">{(c.credits || 3) * 15}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TAB 4: PENDING REGISTRATIONS TABLE ================= */}
        {activeTab === "pending" && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEF2F8] text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-3.5">Registration / Employee ID</th>
                  <th className="p-3.5">Applicant Name</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Date Submitted</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loadingPending ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin text-[#0B2C5C]" />
                        <span className="font-semibold">Loading pending self-registrations...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPending.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No pending self-registration applications found.
                    </td>
                  </tr>
                ) : (
                  filteredPending.map((p) => (
                    <tr key={p.id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#0B2C5C]">{p.registrationId}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{p.fullName}</div>
                        <div className="text-[10px] text-slate-500">{p.email}</div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-700">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          p.role === "STUDENT" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                        }`}>
                          {p.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">{p.department}</td>
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(p.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 flex items-center space-x-1 w-max">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>PENDING APPROVAL</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => { setSelectedPendingItem(p); setShowPendingDetailModal(true); }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors text-[11px] inline-flex items-center space-x-1"
                          title="View Application Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleApproveRegistration(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors text-[11px] inline-flex items-center space-x-1"
                          title="Approve Registration"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleOpenRejectModal(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors text-[11px] inline-flex items-center space-x-1"
                          title="Reject Registration"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* View Pending Registration Detail Modal */}
        {showPendingDetailModal && selectedPendingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071E40]/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-[#0B2C5C] flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Pending Self-Registration Details</span>
                </h3>
                <button
                  onClick={() => setShowPendingDetailModal(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Applicant Name</span>
                    <span className="font-bold text-slate-900">{selectedPendingItem.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Role</span>
                    <span className="font-bold text-slate-900">{selectedPendingItem.role}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">ID / Roll Number</span>
                    <span className="font-mono font-bold text-[#0B2C5C]">{selectedPendingItem.registrationId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Department</span>
                    <span className="font-medium text-slate-800">{selectedPendingItem.department}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-medium">Email Address:</span>
                    <span className="font-mono text-slate-800">{selectedPendingItem.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-medium">Mobile Number:</span>
                    <span className="font-mono text-slate-800">{selectedPendingItem.phone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-medium">RFID Card Tag UID:</span>
                    <span className="font-mono text-slate-800">{selectedPendingItem.details?.rfidCardId || "None"}</span>
                  </div>

                  {selectedPendingItem.role === "STUDENT" && (
                    <>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500 font-medium">Programme / Course:</span>
                        <span className="text-slate-800 font-semibold">{selectedPendingItem.details?.courseName || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500 font-medium">Current Semester:</span>
                        <span className="text-slate-800 font-semibold">Semester {selectedPendingItem.details?.currentSemester}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500 font-medium">Admission Year:</span>
                        <span className="text-slate-800 font-semibold">{selectedPendingItem.details?.admissionYear}</span>
                      </div>
                    </>
                  )}

                  {selectedPendingItem.role === "FACULTY" && (
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500 font-medium">Designation:</span>
                      <span className="text-slate-800 font-semibold">{selectedPendingItem.details?.designation || "Faculty"}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500 font-medium">Submission Timestamp:</span>
                    <span className="font-mono text-slate-600 text-[11px]">
                      {new Date(selectedPendingItem.submittedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenRejectModal(selectedPendingItem.id)}
                    className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleApproveRegistration(selectedPendingItem.id)}
                    className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                  >
                    Approve Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Confirmation Dialog Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071E40]/60 backdrop-blur-xs p-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-4 text-slate-800">
              <div className="flex items-center space-x-2 text-rose-600 border-b border-slate-100 pb-2">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-black text-slate-900">Reject Registration Application</h3>
              </div>

              <form onSubmit={handleConfirmReject} className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Are you sure you want to reject this self-registration application? You can optionally enter a reason for the applicant.
                </p>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Rejection Reason (Optional)</label>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Invalid Roll Number or non-enrolled student details."
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md disabled:opacity-50"
                  >
                    {submitting ? "Rejecting..." : "Confirm Rejection"}
                  </button>
                </div>
              </form>
            </div>
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
                    <label className="block text-slate-700 font-bold mb-1">Student Mobile</label>
                    <input type="text" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Parent Name</label>
                    <input type="text" value={newParentName} onChange={(e) => setNewParentName(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Parent Mobile</label>
                    <input type="text" value={newParentMobile} onChange={(e) => setNewParentMobile(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Address</label>
                    <input type="text" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                  </div>
                </div>

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

        {/* Edit Student Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071E40]/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4 text-slate-800 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-[#0B2C5C]">Edit Student Profile</h3>
                <button
                  onClick={() => setShowEditModal(false)}
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

              <form onSubmit={handleUpdateStudent} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Mobile Phone</label>
                    <input
                      type="text"
                      value={newMobile}
                      onChange={(e) => setNewMobile(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">RFID UID Tag</label>
                    <input
                      type="text"
                      value={newRfid}
                      onChange={(e) => setNewRfid(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-full bg-[#0B2C5C] text-white font-black shadow-md transition-all disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{submitting ? "Saving..." : "Save Changes"}</span>
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
