"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { mockService } from "@/services/mockServices";
import { realtimeService } from "@/services/realtime";
import { IoTDevice } from "@/services/mockData";
import {
  Cpu,
  Plus,
  Radio,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  SlidersHorizontal,
  Volume2,
  Activity,
  Wifi,
  MapPin,
} from "lucide-react";

export default function DevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<IoTDevice[]>(() => mockService.getIoTDevices());
  const [classrooms] = useState(() => mockService.getClassrooms());
  const [activeTab, setActiveTab] = useState<"fleet" | "map">("fleet");

  const [buzzerActive, setBuzzerActive] = useState<string | null>(null);
  const [restartingId, setRestartingId] = useState<string | null>(null);

  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const update = () => setDevices(mockService.getIoTDevices());
    const unsubscribeStore = mockService.subscribe(update);

    // If real backend is active, subscribe to SSE device:telemetry stream
    let unsubscribeTelemetry = () => {};
    let unsubscribeConn = () => {};

    if (process.env.NEXT_PUBLIC_USE_MOCKS !== "true") {
      unsubscribeTelemetry = realtimeService.subscribe("device:telemetry", (data: any) => {
        if (!data) return;
        setDevices((prev) =>
          prev.map((d) =>
            d.id === String(data.id) || d.code === data.deviceCode
              ? {
                  ...d,
                  status: data.isOnline ? "ONLINE" : "OFFLINE",
                  lastSeen: data.secondsSinceHeartbeat !== undefined
                    ? `${data.secondsSinceHeartbeat}s ago`
                    : "Active",
                  firmwareVersion: data.firmwareVersion || d.firmwareVersion,
                }
              : d
          )
        );
      });

      unsubscribeConn = realtimeService.onConnectionChange((connected) => {
        setIsReconnecting(!connected);
      });
    }

    return () => {
      unsubscribeStore();
      unsubscribeTelemetry();
      unsubscribeConn();
    };
  }, []);

  const handleTestBuzzer = (code: string) => {
    setBuzzerActive(code);
    mockService.testBuzzer(code);
    setTimeout(() => {
      setBuzzerActive(null);
    }, 1500);
  };

  const handleRestartDevice = (id: string, code: string) => {
    setRestartingId(code);
    mockService.restartDevice(id, {
      user: user?.name || "Dr. K. Arumugam",
      role: "ADMIN",
    });
    setTimeout(() => {
      setRestartingId(null);
    }, 2000);
  };

  return (
    <DashboardShell allowedRoles={["ADMIN"]}>
      <div className="space-y-6 font-sans text-slate-800">
        <PageHeader
          title="ESP32 IoT Turnstile & Vision Fleet"
          subtitle="Hardware node provisioning, real-time MQTT pings, remote restart commands, and classroom telemetry map"
          breadcrumb={[{ label: "IoT Device Fleet" }]}
          categoryTag="CAMPUS HARDWARE INFRASTRUCTURE"
          action={
            <div className="flex items-center space-x-2">
              <div className="flex bg-white/15 p-1 rounded-full border border-white/25 text-xs font-bold">
                <button
                  onClick={() => setActiveTab("fleet")}
                  className={`px-4 py-1.5 rounded-full transition-all ${
                    activeTab === "fleet" ? "bg-white text-[#0B2C5C] shadow-xs" : "text-white hover:bg-white/10"
                  }`}
                >
                  Fleet Hardware
                </button>
                <button
                  onClick={() => setActiveTab("map")}
                  className={`px-4 py-1.5 rounded-full transition-all ${
                    activeTab === "map" ? "bg-white text-[#0B2C5C] shadow-xs" : "text-white hover:bg-white/10"
                  }`}
                >
                  Classroom Map
                </button>
              </div>
            </div>
          }
        />

        {/* ================= TAB 1: FLEET CARDS ================= */}
        {activeTab === "fleet" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {devices.map((dev) => {
              const isOnline = dev.status === "ONLINE";
              const isBuzzerTesting = buzzerActive === dev.code;
              const isRebooting = restartingId === dev.code;

              return (
                <div
                  key={dev.id}
                  className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4 hover-lift"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#EEF2F8] text-[#0B2C5C] flex items-center justify-center font-bold">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-mono font-black text-slate-900 text-sm">{dev.code}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{dev.macAddress}</div>
                      </div>
                    </div>

                    {/* Solid Status Dot with subtle ring (No neon bloom) */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center space-x-1.5 ${
                        isOnline
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 ring-1 ring-emerald-200"
                          : "bg-rose-100 text-[#EF4444] border-rose-300 ring-1 ring-rose-200"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse-dot" : "bg-[#EF4444]"}`} />
                      <span>{dev.status}</span>
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-[11px] text-slate-500">Location</span>
                      <span className="font-bold text-slate-900">{dev.location}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-[11px] text-slate-500">IP Address</span>
                      <span className="font-mono text-[#0B2C5C]">{dev.ipAddress}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-[11px] text-slate-500">WiFi Signal RSSI</span>
                      <span className="font-mono text-emerald-700 font-bold">{dev.wifiStrength} dBm</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-[11px] text-slate-500">Last Telemetry</span>
                      <span className="font-mono text-slate-700">{dev.lastSeen}</span>
                    </div>
                  </div>

                  {/* Actions (Coral Pill for Actionable Buzzer Test) */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isBuzzerTesting || !isOnline}
                      onClick={() => handleTestBuzzer(dev.code)}
                      className="py-2 px-3 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-colors disabled:opacity-50"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isBuzzerTesting ? "Beeping..." : "Test Buzzer"}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isRebooting || !isOnline}
                      onClick={() => handleRestartDevice(dev.id, dev.code)}
                      className="py-2 px-3 rounded-full bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRebooting ? "animate-spin" : ""}`} />
                      <span>{isRebooting ? "Rebooting..." : "Reboot Node"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= TAB 2: CLASSROOM TELEMETRY MAP ================= */
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#0B2C5C]">Classroom Live Telemetry Map</h3>
                <p className="text-xs text-slate-500">
                  Floor-wise layout of active lecture halls, turnstiles, and camera sensor nodes
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {classrooms.map((room) => (
                <div
                  key={room.roomNumber}
                  className="p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-sm text-[#0B2C5C]">{room.roomNumber}</div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EEF2F8] text-[#0B2C5C]">
                      {room.block}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Camera Node:</span>
                      <strong className="text-slate-800">{room.cameraNode}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned ESP32:</span>
                      <strong className="font-mono text-[#0B2C5C]">{room.deviceId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Turnstile Status:</span>
                      <span className={`font-bold flex items-center space-x-1 ${room.deviceStatus === "ONLINE" ? "text-emerald-700" : "text-[#EF4444]"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${room.deviceStatus === "ONLINE" ? "bg-emerald-500" : "bg-[#EF4444]"}`} />
                        <span>{room.deviceStatus}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
