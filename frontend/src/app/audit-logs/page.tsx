"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { mockService } from "@/services/mockServices";
import { AuditLogItem } from "@/services/mockData";
import { History, Shield, Search, FileSpreadsheet, Lock } from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>(() => mockService.getAuditLogs());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");

  useEffect(() => {
    const update = () => setLogs(mockService.getAuditLogs());
    const unsubscribe = mockService.subscribe(update);
    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === "ALL" || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <DashboardShell allowedRoles={["ADMIN"]}>
      <div className="space-y-6 font-sans text-slate-800">
        <PageHeader
          title="Immutable Security & Institutional Audit Logs"
          subtitle="Cryptographically tracked activity ledger recording all manual overrides, OD decisions, and credential changes"
          breadcrumb={[{ label: "Security Audit Logs" }]}
          categoryTag="CENTRAL SECURITY AUDIT REGISTRY"
        />

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-xs">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Recorded Actions</option>
              <option value="ATTENDANCE_MANUAL_CORRECTION">Manual Overrides</option>
              <option value="OD_APPLICATION_STATUS_UPDATED">OD Approvals</option>
              <option value="STUDENT_ENROLLED">Student Enrolled</option>
              <option value="DEVICE_RESTARTED">Device Restart</option>
              <option value="PASSWORD_CHANGED">Password Change</option>
            </select>
          </div>

          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user, action, target, or reason..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B2C5C]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Immutable Table */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EEF2F8] text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor (Role)</th>
                <th className="p-3.5">Action Code</th>
                <th className="p-3.5">Target Entity</th>
                <th className="p-3.5">Values (Before → After)</th>
                <th className="p-3.5">Institutional Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {entry.timestamp}
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{entry.user}</div>
                    <div className="text-[10px] font-mono text-slate-500">{entry.role}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#EEF2F8] text-[#0B2C5C]">
                      {entry.action}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-800">{entry.target}</td>
                  <td className="p-3.5 font-mono text-[11px]">
                    <span className="text-slate-400 line-through mr-1">{entry.oldValue}</span>
                    <span className="text-emerald-700 font-bold">→ {entry.newValue}</span>
                  </td>
                  <td className="p-3.5 text-slate-600 max-w-xs truncate">{entry.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
