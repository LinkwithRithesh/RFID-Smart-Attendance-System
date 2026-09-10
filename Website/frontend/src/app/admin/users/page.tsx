"use client";
import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { apiClient } from "@/services/apiClient";
import { useAuth } from "@/context/AuthContext";
import { Plus, Edit, Check, Trash } from "lucide-react";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States for Assigning Register Number
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [assignRollNumber, setAssignRollNumber] = useState("");
  const [assignStatus, setAssignStatus] = useState("APPROVED");
  const [assignFullName, setAssignFullName] = useState("");
  const [assignEmail, setAssignEmail] = useState("");
  const [assignPhone, setAssignPhone] = useState("");

  // States for Add Faculty
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [facultyName, setFacultyName] = useState("");
  const [facultyEmail, setFacultyEmail] = useState("");
  const [facultyPhone, setFacultyPhone] = useState("");
  const [facultyDesignation, setFacultyDesignation] = useState("");
  const [facultyDept, setFacultyDept] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get("/users?limit=100");
      setUsers(res.data?.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.patch(`/users/${selectedUser.id}`, {
        fullName: assignFullName,
        email: assignEmail,
        phone: assignPhone,
        isActive: assignStatus === "APPROVED",
        profile: {
          rollNumber: assignRollNumber,
        }
      });
      setShowAssignModal(false);
      fetchUsers();
    } catch (e) {
      console.error(e);
      alert("Failed to update user");
    }
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/users", {
        fullName: facultyName,
        email: facultyEmail,
        phone: facultyPhone,
        password: "changeme123", // Default admin created password
        role: "FACULTY",
        departmentId: Number(facultyDept) || 1, // Fallback to 1
        profile: {
          designation: facultyDesignation,
        }
      });
      setShowAddFacultyModal(false);
      fetchUsers();
    } catch (e) {
      console.error(e);
      alert("Failed to create faculty");
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6 font-sans text-slate-800">
        <PageHeader
          title="User Management & Approvals"
          subtitle="Manage students and faculty, approve registrations, and assign register numbers."
          breadcrumb={[{ label: "Admin Console" }, { label: "User Management" }]}
          categoryTag="ADMINISTRATION"
          action={
            <button
              onClick={() => setShowAddFacultyModal(true)}
              className="px-5 py-2.5 rounded-full bg-[#0B2C5C] hover:bg-[#071E40] text-white font-black text-xs shadow-md transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Faculty</span>
            </button>
          }
        />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-500">Loading users...</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.fullName}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'FACULTY' ? 'bg-indigo-100 text-indigo-800' :
                        u.role === 'ADMIN' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">{u.departmentName || "N/A"}</td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="text-emerald-600 font-bold text-xs flex items-center">
                          <Check className="w-3 h-3 mr-1" /> Approved
                        </span>
                      ) : (
                        <span className="text-amber-600 font-bold text-xs">Pending Approval</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setAssignRollNumber(u.profile?.rollNumber || "");
                          setAssignStatus(u.isActive ? "APPROVED" : "PENDING");
                          setAssignFullName(u.fullName || "");
                          setAssignEmail(u.email || "");
                          setAssignPhone(u.phone || "");
                          setShowAssignModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-[#0B2C5C] hover:bg-slate-100 rounded"
                        title="Edit / Approve User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Assign Modal */}
        {showAssignModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071E40]/60 backdrop-blur-xs p-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-black text-[#0B2C5C]">Edit & Approve User</h3>
                <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>
              <form onSubmit={handleUpdateUser} className="space-y-4 text-sm">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                  <input type="text" required value={assignFullName} onChange={(e) => setAssignFullName(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email</label>
                  <input type="email" required value={assignEmail} onChange={(e) => setAssignEmail(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone</label>
                  <input type="text" value={assignPhone} onChange={(e) => setAssignPhone(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" />
                </div>
                {selectedUser.role === 'STUDENT' && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Assign Register Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 21CS001"
                      value={assignRollNumber}
                      onChange={(e) => setAssignRollNumber(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Approval Status</label>
                  <select
                    value={assignStatus}
                    onChange={(e) => setAssignStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <option value="PENDING">Pending (Inactive)</option>
                    <option value="APPROVED">Approved (Active)</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-3 rounded-full bg-[#0B2C5C] hover:bg-[#071E40] text-white font-black text-sm">
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Add Faculty Modal */}
        {showAddFacultyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071E40]/60 backdrop-blur-xs p-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-black text-[#0B2C5C]">Add Faculty</h3>
                <button onClick={() => setShowAddFacultyModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>
              <form onSubmit={handleAddFaculty} className="space-y-3 text-sm">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                  <input type="text" required value={facultyName} onChange={(e) => setFacultyName(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email</label>
                  <input type="email" required value={facultyEmail} onChange={(e) => setFacultyEmail(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone</label>
                  <input type="text" required value={facultyPhone} onChange={(e) => setFacultyPhone(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Designation</label>
                  <input type="text" required value={facultyDesignation} onChange={(e) => setFacultyDesignation(e.target.value)} placeholder="e.g. Associate Professor" className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department ID</label>
                  <input type="number" required value={facultyDept} onChange={(e) => setFacultyDept(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900" />
                </div>
                <button type="submit" className="w-full py-3 rounded-full bg-[#0B2C5C] hover:bg-[#071E40] text-white font-black text-sm">
                  Create Faculty
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
