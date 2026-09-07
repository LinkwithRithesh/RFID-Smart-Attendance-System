"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { FileDown, FileSpreadsheet } from "lucide-react";

function currentMonthRange() {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    to: now.toISOString(),
  };
}

function ReportsContent() {
  const { token } = useAuth();
  const [downloading, setDownloading] = useState<"pdf" | "excel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (format: "pdf" | "excel") => {
    setError(null);
    setDownloading(format);
    try {
      const { from, to } = currentMonthRange();
      const { downloadUrl } = await api.getReports({ department: "CSE", format, from, to });
      const res = await fetch(downloadUrl, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (!ok(res)) throw new Error("Failed to generate report");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cse-attendance-report.${format === "pdf" ? "pdf" : "xlsx"}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to download report");
    } finally {
      setDownloading(null);
    }
  };

  function ok(res: Response) {
    return res.ok;
  }

  return (
    <div className="space-y-6 font-sans text-slate-800">
      <PageHeader
        title="Institutional Attendance Reports Center"
        subtitle="Generate signed administrative attendance statements and Excel roster exports"
        breadcrumb={[{ label: "Reports Center" }]}
        categoryTag="REPORTS & DATA EXPORTS"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
        <button
          onClick={() => handleDownload("pdf")}
          disabled={downloading !== null}
          className="flex flex-col items-start p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs hover-lift transition-all text-left disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#EF4444] flex items-center justify-center font-bold mb-3">
            <FileDown className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-sm text-[#0B2C5C]">Department Official Statement (PDF)</span>
          <span className="text-xs text-slate-500 mt-1">
            CSE department monthly verified report — {downloading === "pdf" ? "Generating..." : "Click to download PDF"}
          </span>
        </button>

        <button
          onClick={() => handleDownload("excel")}
          disabled={downloading !== null}
          className="flex flex-col items-start p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs hover-lift transition-all text-left disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-3">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-sm text-[#0B2C5C]">Raw Attendance Telemetry (Excel)</span>
          <span className="text-xs text-slate-500 mt-1">
            Comprehensive spreadsheet dataset with RFID UID and Face matching confidence scores.
          </span>
        </button>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <DashboardShell allowedRoles={["FACULTY", "ADMIN"]}>
      <ReportsContent />
    </DashboardShell>
  );
}
