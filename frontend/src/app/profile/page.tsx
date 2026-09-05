"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { mockService } from "@/services/mockServices";
import {
  User,
  Edit,
  Lock,
  Download,
  Phone,
  Mail,
  MapPin,
  ShieldAlert,
  Save,
  CheckCircle,
  Camera,
  GraduationCap,
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"view" | "edit">("view");

  const [mobile, setMobile] = useState(user?.phone || "9345641567");
  const [email, setEmail] = useState(user?.email || "2025105002@student.annauniv.edu");
  const [address, setAddress] = useState("12, Gandhi Road, Adyar, Chennai - 600020");
  const [parentMobile, setParentMobile] = useState("9840123456");
  const [parentName, setParentName] = useState("Anand K.");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    mockService.updateStudent(
      user?.userId || "2025105002",
      { phone: mobile, email, address, parentName, parentPhone: parentMobile },
      { user: user?.name || "Student User", role: "STUDENT", reason: "Student profile self-update" }
    );
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    setActiveTab("view");
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    mockService.writeAuditLog({
      user: user?.name || user?.userId || "Student User",
      role: "STUDENT",
      action: "PASSWORD_CHANGED",
      target: user?.userId || "2025105002",
      oldValue: "••••••••",
      newValue: "•••••••• (HASHED)",
      reason: "User self-service password update",
    });
    alert("Password changed successfully! Audit log entry recorded.");
    setShowPasswordModal(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleDownloadPDF = () => {
    alert("Downloading official verified Student Profile PDF with biometric credentials...");
  };

  return (
    <DashboardShell>
      <div className="space-y-6 font-sans text-slate-800">
        <PageHeader
          title="Student Profile & Biometric Credentials"
          subtitle="View and manage verified institutional records, contact information, and RFID/Face registration"
          breadcrumb={[{ label: "Student Profile" }]}
          categoryTag="INSTITUTIONAL STUDENT IDENTITY"
          action={
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Profile PDF</span>
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-xs flex items-center space-x-1.5 shadow-md"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>
            </div>
          }
        />

        {/* View / Edit Mode Switcher */}
        <div className="flex items-center space-x-2 bg-white border border-[#E2E8F0] p-1.5 rounded-2xl shadow-xs w-fit">
          <button
            onClick={() => setActiveTab("view")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "view" ? "bg-[#0B2C5C] text-white shadow-xs" : "text-slate-600 hover:text-[#0B2C5C]"
            }`}
          >
            Verified Credentials
          </button>
          <button
            onClick={() => setActiveTab("edit")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "edit" ? "bg-[#0B2C5C] text-white shadow-xs" : "text-slate-600 hover:text-[#0B2C5C]"
            }`}
          >
            Update Contact Details
          </button>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Profile details updated successfully and committed to CeGov database.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Identity Card */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs text-center space-y-4">
            <div className="w-24 h-24 rounded-2xl bg-[#0B2C5C] text-white flex items-center justify-center font-black text-3xl mx-auto shadow-md">
              {user?.name?.charAt(0) || "R"}
            </div>
            <div>
              <h2 className="text-lg font-black text-[#0B2C5C]">{user?.name || "RITHESHWARAN A"}</h2>
              <div className="text-xs font-mono font-bold text-slate-500 mt-0.5">
                Roll No: {user?.userId || "2025105002"}
              </div>
              <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                Active Student • Semester 3
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Degree:</span>
                <strong className="text-slate-800">B.E. ECE</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Batch:</span>
                <strong className="text-slate-800">2024 - 2028</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">RFID UID:</span>
                <strong className="font-mono text-[#0B2C5C]">E2-80-68-9A-00</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Face Vision:</span>
                <span className="text-emerald-700 font-bold">Enrolled (512D Vector)</span>
              </div>
            </div>
          </div>

          {/* Right: Contact & Emergency Information */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#0B2C5C]">Personal & Emergency Details</h3>
              <p className="text-xs text-slate-500">
                Contact details used for automated attendance alerts and official communications
              </p>
            </div>

            {activeTab === "view" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Student Email</div>
                  <div className="font-bold text-slate-900">{email}</div>
                </div>
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Student Mobile</div>
                  <div className="font-bold text-slate-900 font-mono">{mobile}</div>
                </div>
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Parent / Guardian Name</div>
                  <div className="font-bold text-slate-900">{parentName}</div>
                </div>
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Parent Mobile (SMS)</div>
                  <div className="font-bold text-slate-900 font-mono">{parentMobile}</div>
                </div>
                <div className="sm:col-span-2 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Residential Address</div>
                  <div className="font-bold text-slate-900">{address}</div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Student Mobile</label>
                    <input
                      type="text"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Student Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Parent Mobile (SMS Alerts)</label>
                    <input
                      type="text"
                      required
                      value={parentMobile}
                      onChange={(e) => setParentMobile(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Parent Name</label>
                    <input
                      type="text"
                      required
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">Address</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-xs shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071E40]/60 backdrop-blur-xs p-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-4 text-slate-800">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-[#0B2C5C]">Change Account Password</h3>
                <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Old Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black shadow-md"
                  >
                    Update Password
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
