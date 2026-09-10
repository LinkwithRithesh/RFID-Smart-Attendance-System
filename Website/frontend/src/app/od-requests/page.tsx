"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/services/apiClient";
import {
  FileCheck2,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Upload,
  User,
  AlertCircle,
  ChevronRight,
  Download,
} from "lucide-react";

export default function ODRequestsPage() {
  const { user } = useAuth();
  const role = user?.role || "STUDENT";
  const studentRoll = user?.userId || "";
  const studentName = user?.name || "";


  const [requests, setRequests] = useState<any[]>([]);
  const fetchRequests = () => apiClient.get("/od-requests").then(r => setRequests(r.data?.requests || r.data || []));
  useEffect(() => { fetchRequests(); }, []);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Form states
  const [category, setCategory] = useState<"Sports" | "Symposium" | "Medical" | "Hackathon" | "Personal">("Symposium");
  const [date, setDate] = useState("2026-09-18");
  const [endDate, setEndDate] = useState("2026-09-19");
  const [subject, setSubject] = useState("EC3404 Digital Communications");
  const [reason, setReason] = useState("");
  const [fileName, setFileName] = useState("ieee_symposium_invite.pdf");

  

  const handleSubmitOD = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiClient.post("/od-requests", { type: category, startDate: date, endDate, reason }); fetchRequests();
    setShowSubmitModal(false);
    setReason("");
  };

  const handleUpdateStatus = async (
    id: string,
    status: "FACULTY_APPROVED" | "APPROVED" | "REJECTED"
  ) => {
    await apiClient.patch(`/od-requests/${id}/status`, { status, remarks: "Reviewed via institutional portal" }); fetchRequests();
  };

  const handleDeleteOD = async (id: string) => {
    if (confirm("Are you sure you want to delete this OD request?")) {
      await apiClient.delete(`/od-requests/${id}`);
      fetchRequests();
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6 font-sans text-slate-800">
        <PageHeader
          title="On-Duty (OD) & Medical Leave Applications"
          subtitle="Submit certificates for attendance condonation and track 3-stage university verification"
          breadcrumb={[{ label: "OD & Leave Management" }]}
          categoryTag="STUDENT SERVICES & CONDONATION"
          action={
            role === "STUDENT" ? (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-5 py-2.5 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-xs shadow-md transition-all flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Apply New OD Request</span>
              </button>
            ) : null
          }
        />

        {/* Requests List */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] p-10 rounded-2xl text-center text-slate-500 shadow-xs">
              No OD or leave applications recorded in this session.
            </div>
          ) : (
            requests.map((req) => {
              const isPendingFaculty = req.status === "SUBMITTED";
              const isPendingHOD = req.status === "FACULTY_APPROVED";
              const isApproved = req.status === "APPROVED";
              const isRejected = req.status === "REJECTED";

              const stage1_submitted = true;
              const stage2_facultyRecommended = req.status === "FACULTY_APPROVED" || req.status === "APPROVED";
              const stage3_hodApproved = req.status === "APPROVED";

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4 hover-lift"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="w-8 h-8 rounded-lg bg-[#EEF2F8] text-[#0B2C5C] flex items-center justify-center font-bold">
                        <FileCheck2 className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900 text-sm">{req.studentName}</span>
                          <span className="font-mono text-xs font-bold text-slate-500">({req.studentRoll})</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EEF2F8] text-[#0B2C5C]">
                            {req.category}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {req.department} • Affected: <strong className="text-slate-700">{req.subject}</strong>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : isRejected
                          ? "bg-rose-100 text-[#EF4444] border border-rose-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {req.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* 3-Stage Progress Timeline */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-center text-[11px]">
                    <div className={`p-2 rounded-lg ${stage1_submitted ? "bg-white text-emerald-700 font-bold shadow-xs" : "text-slate-400"}`}>
                      ✓ 1. Submitted
                    </div>
                    <div className={`p-2 rounded-lg ${stage2_facultyRecommended ? "bg-white text-emerald-700 font-bold shadow-xs" : "text-slate-400"}`}>
                      {stage2_facultyRecommended ? "✓ 2. Faculty Endorsed" : "• 2. Faculty Review"}
                    </div>
                    <div className={`p-2 rounded-lg ${stage3_hodApproved ? "bg-white text-emerald-700 font-bold shadow-xs" : "text-slate-400"}`}>
                      {stage3_hodApproved ? "✓ 3. HOD Stamped" : "• 3. HOD Decision"}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
                    <div>
                      <span>Duration: <strong className="text-slate-800">{req.date} to {req.endDate}</strong></span>
                      <p className="text-slate-500 mt-0.5 italic">&quot;{req.reason}&quot;</p>
                    </div>

                    {/* Faculty/Admin Decision Actions */}
                    {role !== "STUDENT" && !isApproved && !isRejected && (
                      <div className="flex items-center space-x-2">
                        {role === "FACULTY" && isPendingFaculty && (
                          <button
                            onClick={() => handleUpdateStatus(req.id, "FACULTY_APPROVED")}
                            className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                          >
                            Recommend to HOD
                          </button>
                        )}
                        {role === "ADMIN" && (
                          <button
                            onClick={() => handleUpdateStatus(req.id, "APPROVED")}
                            className="px-4 py-1.5 rounded-full bg-[#0B2C5C] hover:bg-[#071E40] text-white font-bold text-xs shadow-xs"
                          >
                            HOD Final Approval
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(req.id, "REJECTED")}
                          className="px-4 py-1.5 rounded-full bg-rose-50 border border-rose-300 hover:bg-rose-100 text-[#EF4444] font-bold text-xs"
                        >
                          Reject Application
                        </button>
                      </div>
                    )}
                    
                    {(role === "ADMIN" || role === "STUDENT") && (
                      <div className="flex items-center mt-2 sm:mt-0">
                        <button
                          onClick={() => handleDeleteOD(req.id)}
                          className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Application Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071E40]/60 backdrop-blur-xs p-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-black text-[#0B2C5C]">Apply for On-Duty (OD) / Medical Leave</h3>
                <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-700">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitOD} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                  >
                    <option value="Symposium">Technical Symposium</option>
                    <option value="Hackathon">Inter-University Hackathon</option>
                    <option value="Sports">Zonal Sports Tournament</option>
                    <option value="Medical">Medical / Health Leave</option>
                    <option value="Personal">Personal Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">From Date</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">To Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Course Affected</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Reason / Justification</label>
                  <textarea
                    rows={3}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide details regarding event, institute name, or medical reason..."
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black shadow-md"
                  >
                    Submit Application
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


