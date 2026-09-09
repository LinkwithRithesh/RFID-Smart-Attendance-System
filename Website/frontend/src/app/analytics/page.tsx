"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { apiClient } from "@/services/apiClient";
import { AnomalyItem } from "@/services/mockData";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  PieChart as PieIcon,
  Clock,
  ShieldAlert,
  Cpu,
  Radio,
  ScanFace,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AnalyticsPage() {
  
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  useEffect(() => {
    let mounted = true;
    apiClient.get("/analytics/anomalies").then(res => {
      if(mounted && res.data) setAnomalies(res.data);
    });
    return () => { mounted = false; };
  }, []);


  

  const methodBreakdown = [
    { name: "RFID Turnstiles", value: 68, color: "#0B2C5C" },
    { name: "AI Face Vision", value: 28, color: "#3B82F6" },
    { name: "Manual Override", value: 4, color: "#F4573C" },
  ];

  const hourlyAttendance = [
    { hour: "08:30 AM", scans: 412 },
    { hour: "09:00 AM", scans: 1420 },
    { hour: "10:00 AM", scans: 610 },
    { hour: "11:00 AM", scans: 490 },
    { hour: "01:30 PM", scans: 950 },
    { hour: "02:30 PM", scans: 320 },
    { hour: "04:30 PM", scans: 210 },
  ];

  return (
    <DashboardShell allowedRoles={["ADMIN"]}>
      <div className="space-y-6 font-sans text-slate-800">
        <PageHeader
          title="Campus Attendance Analytics & Anomaly Detection"
          subtitle="Real-time telemetric breakdown between RFID and AI face recognition, hourly scan spikes, and heuristic anomaly feeds"
          breadcrumb={[{ label: "Analytics & Telemetry" }]}
          categoryTag="INSTITUTIONAL METRICS & AUDITING"
        />

        {/* Top 3 Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs hover-lift">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                RFID Turnstile Volume
              </span>
              <Radio className="w-5 h-5 text-[#0B2C5C]" />
            </div>
            <div className="text-3xl font-black text-[#0B2C5C] font-mono mt-1">68.2%</div>
            <div className="text-[11px] text-slate-500 mt-1">2,618 card swipes today</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs hover-lift">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                AI Face Vision Volume
              </span>
              <ScanFace className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <div className="text-3xl font-black text-[#3B82F6] font-mono mt-1">27.8%</div>
            <div className="text-[11px] text-slate-500 mt-1">1,067 computer vision matches</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs hover-lift">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Flagged Anomalies
              </span>
              <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
            </div>
            <div className="text-3xl font-black text-[#EF4444] font-mono mt-1">
              {anomalies.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Heuristic triggers under review</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Hourly Scan Distribution (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0B2C5C] uppercase tracking-tight">
                Hourly Peak Scan Distribution
              </h3>
              <span className="text-xs font-mono text-slate-500">Today&apos;s Traffic</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="hour" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "10px", fontSize: "12px", color: "#0B2C5C" }}
                  />
                  <Bar dataKey="scans" fill="#0B2C5C" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Verification Method Breakdown (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0B2C5C] uppercase tracking-tight">
                Sensor Method Share
              </h3>
              <span className="text-xs font-mono text-slate-500">Biometric vs RFID</span>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={methodBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {methodBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "10px", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center space-x-5 text-xs text-slate-600">
              {methodBreakdown.map((m) => (
                <div key={m.name} className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                  <span>{m.name}: <strong className="text-slate-900">{m.value}%</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Anomaly Detection Feed */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-[#EF4444]" />
              <h3 className="text-sm font-extrabold text-[#0B2C5C] uppercase tracking-tight">
                Heuristic Attendance Anomaly Log
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">Automated Anti-Fraud Flagging</span>
          </div>

          <div className="space-y-3">
            {anomalies.map((anom) => (
              <div
                key={anom.id}
                className="p-4 rounded-xl bg-rose-50/40 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {anom.studentRoll} ({anom.studentName})
                      </span>
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[9px] bg-rose-100 text-[#EF4444] border border-rose-300">
                        {anom.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 font-medium">{anom.description}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-[11px] text-slate-500">{anom.timestamp}</div>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                    anom.severity === "CRITICAL"
                      ? "bg-rose-100 text-[#EF4444] border-rose-300"
                      : anom.severity === "HIGH"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-slate-100 text-slate-700 border-slate-300"
                  }`}>
                    {anom.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
