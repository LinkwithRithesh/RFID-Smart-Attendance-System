"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";

import { Loader2, ArrowLeft, Edit2, CheckCircle, Camera } from "lucide-react";

export default function AdminUserEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Editing state
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>("");

  useEffect(() => {
    if (token) fetchUser();
  }, [token, id]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  
  const handlePhotoUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('faceImage', file);

      // Upload to public auth endpoint which just returns filename
      const uploadRes = await fetch('http://localhost:5000/api/v1/auth/register/face', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(uploadData.message || 'Failed to upload photo');
      }

      // Update user with new filename
      const filename = uploadData.data.faceFileName;
      const resObj = await fetch(`http://localhost:5000/api/v1/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ faceFileName: filename })
      });
      const res = await resObj.json();
      if (res && res.success) {
        setSuccessMsg('Photo updated successfully');
        setProfile(res.data);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        throw new Error('Failed to save photo to profile');
      }
    } catch (err: any) {
      alert(err.message || "Failed to upload photo");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (fieldPath: string, newValue: any) => {
    setSaving(true);
    try {
      const payload: any = {};
      
      // Determine if field is profile-specific or base user field
      if (['rollNumber', 'employeeId', 'dob', 'gender', 'admissionYear', 'courseId', 'currentSemester', 'parentName', 'parentPhone', 'address', 'designation'].includes(fieldPath)) {
        let val = newValue;
        if (['courseId', 'currentSemester', 'admissionYear'].includes(fieldPath)) {
            val = parseInt(newValue, 10);
        }
        payload.profile = { [fieldPath]: val };
      } else {
        payload[fieldPath] = newValue;
      }

      const res = await fetch(`http://localhost:5000/api/v1/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Updated ${fieldPath} successfully`);
        setProfile(data.data);
        setEditField(null);
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert(data.message || "Failed to update");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setSaving(false);
    }
  };

  const InlineEdit = ({ label, field, value, type = "text" }: { label: string, field: string, value: any, type?: string }) => {
    const isEditing = editField === field;

    return (
      <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
        <span className="text-slate-500 uppercase font-bold text-[10px] w-1/3">{label}</span>
        <div className="w-2/3 flex items-center justify-between group">
          {isEditing ? (
            <div className="flex items-center space-x-2 w-full">
              <input 
                type={type}
                value={editValue}
                onChange={(e) => setEditValue(type === 'number' ? Number(e.target.value) : e.target.value)}
                className="flex-1 p-1.5 border border-[#0B2C5C] rounded bg-white text-xs font-bold"
                autoFocus
              />
              <button 
                onClick={() => handleSave(field, editValue)}
                disabled={saving}
                className="bg-emerald-500 text-white p-1.5 rounded hover:bg-emerald-600 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              </button>
              <button onClick={() => setEditField(null)} className="text-slate-400 hover:text-slate-600 text-xs px-2 font-bold">
                Cancel
              </button>
            </div>
          ) : (
            <>
              <strong className="text-slate-800 text-xs font-mono">{value || "N/A"}</strong>
              <button 
                onClick={() => { setEditField(field); setEditValue(value || ""); }}
                className="text-slate-300 hover:text-[#0B2C5C] transition-colors p-1 opacity-0 group-hover:opacity-100"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#0B2C5C]" /></div>
      </DashboardShell>
    );
  }

  if (!profile) return <DashboardShell><div className="p-8">User not found</div></DashboardShell>;

  return (
    <DashboardShell>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center space-x-4 mb-4">
          <button onClick={() => router.push('/admin/users')} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <PageHeader title="Admin Profile Editor" subtitle={`Managing ${profile.fullName}`} />
        </div>

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Identity Card & Photo */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs text-center space-y-4">
              <div className="relative w-32 h-32 mx-auto">
                {profile.faceImagePath ? (
                  <img src={profile.faceImagePath.startsWith('http') ? profile.faceImagePath : `http://localhost:5000${profile.faceImagePath}`} className="w-full h-full rounded-2xl object-cover shadow-md" alt="Profile" />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-[#0B2C5C] text-white flex items-center justify-center font-black text-4xl shadow-md">
                    {profile.fullName?.charAt(0)}
                  </div>
                )}
                <button onClick={() => document.getElementById('photo-upload')?.click()} className="absolute -bottom-2 -right-2 p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:text-[#0B2C5C] transition-colors" title="Change Photo">
                    <Camera className="w-4 h-4 text-slate-500" />
                  </button>
                  <input type="file" id="photo-upload" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </div>
              
              <div>
                <h2 className="text-lg font-black text-[#0B2C5C]">{profile.fullName}</h2>
                <div className="text-xs font-mono font-bold text-slate-500 mt-0.5">
                  {profile.profile?.rollNumber || profile.profile?.employeeId || "No ID"}
                </div>
                <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                  {profile.role?.name || profile.role}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-xs">
              <h3 className="text-xs font-black text-rose-800 uppercase mb-3">Admin Actions</h3>
              <div className="space-y-3">
                <div className="border border-rose-100 rounded-xl p-3 bg-rose-50">
                  <InlineEdit label="Reset Password" field="password" value="********" type="text" />
                  <p className="text-[9px] text-rose-500 mt-1">Force changes the user's password immediately.</p>
                </div>
                <div className="border border-slate-100 rounded-xl p-3">
                  <InlineEdit label="Status (ACTIVE/INACTIVE)" field="status" value={profile.status} />
                </div>
                <div className="border border-slate-100 rounded-xl p-3">
                  <InlineEdit label="RFID Card UID" field="rfidCardId" value={profile.rfidCardId} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Detailed Information Fields */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
              <h3 className="text-sm font-black text-[#0B2C5C] border-b border-slate-100 pb-2 mb-4">Academic & Core Information</h3>
              <div className="space-y-1">
                <InlineEdit label="Full Name" field="fullName" value={profile.fullName} />
                <InlineEdit label="Email Address" field="email" value={profile.email} type="email" />
                <InlineEdit label="Mobile Number" field="phone" value={profile.phone} />
                
                {profile.role === 'STUDENT' && (
                  <>
                    <InlineEdit label="Roll Number" field="rollNumber" value={profile.profile?.rollNumber} />
                    <InlineEdit label="Course ID" field="courseId" value={profile.profile?.courseId} type="number" />
                    <InlineEdit label="Current Semester" field="currentSemester" value={profile.profile?.currentSemester} type="number" />
                    <InlineEdit label="Admission Year" field="admissionYear" value={profile.profile?.admissionYear} type="number" />
                    <InlineEdit label="DOB (YYYY-MM-DD)" field="dob" value={profile.profile?.dob ? profile.profile.dob.split('T')[0] : ""} />
                    <InlineEdit label="Gender" field="gender" value={profile.profile?.gender} />
                  </>
                )}

                {profile.role === 'FACULTY' && (
                  <>
                    <InlineEdit label="Employee ID" field="employeeId" value={profile.profile?.employeeId} />
                    <InlineEdit label="Designation" field="designation" value={profile.profile?.designation} />
                  </>
                )}
              </div>
            </div>

            {profile.role === 'STUDENT' && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
                <h3 className="text-sm font-black text-[#0B2C5C] border-b border-slate-100 pb-2 mb-4">Emergency & Parent Info</h3>
                <div className="space-y-1">
                  <InlineEdit label="Parent Name" field="parentName" value={profile.profile?.parentName} />
                  <InlineEdit label="Parent Mobile" field="parentPhone" value={profile.profile?.parentPhone} />
                  <InlineEdit label="Home Address" field="address" value={profile.profile?.address} />
                </div>
              </div>
            )}
            
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
