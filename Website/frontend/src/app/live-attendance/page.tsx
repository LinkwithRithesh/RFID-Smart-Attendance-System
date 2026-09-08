"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { mockService } from "@/services/mockServices";
import { realtimeService } from "@/services/realtime";
import {
  Radio,
  Play,
  Pause,
  QrCode,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Wifi,
  Cpu,
  Layers,
} from "lucide-react";

interface LiveFeedItem {
  id: string;
  time: string;
  studentName: string;
  rollNo: string;
  room: string;
  method: string;
  status: "PRESENT" | "ABSENT";
  confidence: number;
}

export default function LiveAttendancePage() {
  const { user } = useAuth();
  const role = user?.role || "FACULTY";

  const [sessionActive, setSessionActive] = useState(false);
  const [totalEnrolled] = useState(0);
  const [presentCount, setPresentCount] = useState(0);

  const [feed, setFeed] = useState<LiveFeedItem[]>([]);

  // Emergency QR Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrToken, setQrToken] = useState("SECURE-QR-984214-ROTATING");

  // Manual Override Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualRoll, setManualRoll] = useState("");
  const [manualReason, setManualReason] = useState("");

  // Rotating QR code simulator
  useEffect(() => {
    if (showQrModal) {
      const interval = setInterval(() => {
        setQrToken(`SECURE-QR-${Math.floor(100000 + Math.random() * 900000)}-ROTATING`);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [showQrModal]);

  const [isReconnecting, setIsReconnecting] = useState(false);

  // Realtime SSE stream integration
  useEffect(() => {
    if (!sessionActive) return;

    // Connect to active attendance session SSE stream
    const sessionId = "1";
    const unsubscribeStream = realtimeService.subscribe(`session:${sessionId}`, (data: any) => {
      if (!data) return;
      const now = new Date();
      const nowTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      const newScan: LiveFeedItem = {
        id: String(data.id || Date.now()),
        time: data.time || nowTime,
        studentName: data.studentName || data.user?.fullName || "Student",
        rollNo: data.studentRoll || data.user?.studentProfile?.rollNumber || "",
        room: data.room || "Room 302",
        method: data.method || "RFID Turnstile",
        status: data.status || "PRESENT",
        confidence: data.confidence || 100,
      };

      setFeed((prev) => [newScan, ...prev.slice(0, 19)]);
      setPresentCount((c) => c + 1);
    });

    const unsubscribeConn = realtimeService.onConnectionChange((connected) => {
      setIsReconnecting(!connected);
    });

    return () => {
      unsubscribeStream();
      unsubscribeConn();
    };
  }, [sessionActive]);


  const handleManualOverride = (e: React.FormEvent) => {
    e.preventDefault();
    const students = mockService.getStudents();
    const found = students.find((s) => s.rollNo === manualRoll);
    const name = found ? found.name : "MANUAL VERIFIED STUDENT";

    const now = new Date();
    const nowTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    const newEntry: LiveFeedItem = {
      id: Date.now().toString(),
      time: nowTime,
      studentName: name,
      rollNo: manualRoll,
      room: "Room 302",
      method: "Manual Override",
      status: "PRESENT",
      confidence: 100,
    };

    setFeed((prev) => [newEntry, ...prev]);
    setPresentCount((c) => Math.min(totalEnrolled, c + 1));

    mockService.writeAuditLog({
      user: user?.name || user?.userId || "Faculty Reviewer",
      role: role as "FACULTY" | "ADMIN",
      action: "ATTENDANCE_MANUAL_CORRECTION",
      target: `${manualRoll} (${name}) • Room 302`,
      oldValue: "ABSENT",
      newValue: "PRESENT",
      reason: manualReason,
    });

    setShowManualModal(false);
  };

  return (
    <DashboardShell>
      <div className="space-y-6 font-sans text-slate-800">
        <PageHeader
          title="Live Classroom Attendance Console"
          subtitle="Real-time telemetry stream from turnstiles and AI Face Vision nodes for active lecture session"
          breadcrumb={[{ label: "Live Attendance" }]}
          categoryTag="REAL-TIME TELEMETRY MONITOR"
          action={
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSessionActive(!sessionActive)}
                className={`px-4 py-2 rounded-full font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors ${
                  sessionActive
                    ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                    : "bg-emerald-600 text-white hover:bg-emerald-500"
                }`}
              >
                {sessionActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{sessionActive ? "Pause Stream" : "Resume Stream"}</span>
              </button>

              <button
                onClick={() => setShowManualModal(true)}
                className="px-4 py-2 rounded-full bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0B2C5C] font-bold text-xs flex items-center space-x-1.5 shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Manual Override</span>
              </button>
            </div>
          }
        />

        {/* Real-time Reconnection Banner */}
        {isReconnecting && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold shadow-xs animate-pulse">
            <div className="flex items-center space-x-2.5">
              <RotateCcw className="w-4 h-4 animate-spin text-amber-700" />
              <span>Reconnecting to Live Attendance SSE Stream... hardware swipes will sync automatically.</span>
            </div>
            <span className="text-[11px] font-mono uppercase bg-amber-200/80 px-2 py-0.5 rounded-md text-amber-800">
              Auto-Retrying
            </span>
          </div>
        )}

        {/* Top Session Status Card */}
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-[#0B2C5C] bg-[#EEF2F8] px-2 py-0.5 rounded">
                  CS3401 • Room 302 (Block A)
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center space-x-1.5 ${
                  sessionActive
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
                  <span>{sessionActive ? "SESSION ACTIVE" : "SESSION PAUSED"}</span>
                </span>
              </div>
              <h2 className="text-xl font-black text-[#0B2C5C] mt-1">Algorithms & Data Structures (Period 2)</h2>
            </div>

            <button
              onClick={() => setShowQrModal(true)}
              className="px-4 py-2 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-xs flex items-center space-x-1.5 shadow-md transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Emergency Dynamic QR</span>
            </button>
          </div>

          {/* Telemetry Numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Enrolled Students</span>
              <div className="text-2xl font-black text-[#0B2C5C] font-mono">{totalEnrolled}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Present Verified</span>
              <div className="text-2xl font-black text-emerald-700 font-mono">{presentCount}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Absent</span>
              <div className="text-2xl font-black text-[#EF4444] font-mono">{totalEnrolled - presentCount}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Live Turnout Rate</span>
              <div className="text-2xl font-black text-[#0B2C5C] font-mono">
                {((presentCount / totalEnrolled) * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full bg-[#EEF2F8] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#0B2C5C] h-full rounded-full transition-all duration-700"
              style={{ width: `${(presentCount / totalEnrolled) * 100}%` }}
            />
          </div>
        </div>

        {/* Realtime Event Stream Feed (Strip Glow Effects) */}
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-[#0B2C5C]" />
              <h3 className="text-sm font-extrabold text-[#0B2C5C] uppercase tracking-tight">
                Live Attendance Event Stream
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-700 font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
              <span>Streaming from ESP32-01 & CAM-302</span>
            </span>
          </div>

          <div className="space-y-2.5">
            {feed.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-all animate-slide-in hover-lift"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900">{item.studentName}</span>
                      <span className="font-mono text-slate-500 font-bold text-[11px]">({item.rollNo})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {item.room} • Match Confidence: {item.confidence}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#EEF2F8] text-[#0B2C5C] font-mono text-[10px] font-bold">
                    {item.method}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">{item.time}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ✓ VERIFIED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Dynamic QR Modal */}
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071E40]/60 backdrop-blur-xs p-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-4 text-center text-slate-800">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-bold text-xs text-[#0B2C5C] uppercase">Emergency QR Check-in</span>
                <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <div className="p-4 bg-slate-100 rounded-2xl inline-block border border-slate-200">
                <div className="w-48 h-48 bg-white border-2 border-[#0B2C5C] rounded-xl flex flex-col items-center justify-center space-y-2 p-3 shadow-inner">
                  <QrCode className="w-32 h-32 text-[#0B2C5C]" />
                  <div className="text-[9px] font-mono text-slate-500 font-bold truncate max-w-full">
                    {qrToken}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600">
                Rotating dynamic QR token expires every 5 seconds to prevent screenshot sharing.
              </p>
            </div>
          </div>
        )}

        {/* Manual Override Modal */}
        {showManualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071E40]/60 backdrop-blur-xs p-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 text-slate-800">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-[#0B2C5C]">Manual Attendance Verification</h3>
                <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <form onSubmit={handleManualOverride} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Student Roll Number</label>
                  <input
                    type="text"
                    required
                    value={manualRoll}
                    onChange={(e) => setManualRoll(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Override Reason</label>
                  <textarea
                    rows={3}
                    required
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black shadow-md"
                  >
                    Mark Verified Present
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
