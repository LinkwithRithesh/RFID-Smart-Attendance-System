"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ScanFace,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function FaceRecognitionPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleStartScan = () => {
    setIsScanning(true);
    setVerificationResult(null);
    setPipelineStep(1);

    setTimeout(() => setPipelineStep(2), 700);
    setTimeout(() => setPipelineStep(3), 1400);
    setTimeout(() => setPipelineStep(4), 2100);
    setTimeout(() => {
      setPipelineStep(5);
      setIsScanning(false);
      setVerificationResult({
        name: "RITHESHWARAN A",
        rollNo: "2025105002",
        department: "Electronics & Communication Engg",
        confidence: 99.4,
        matchTime: "0.38s",
        liveness: "PASSED (Anti-Spoof Verified)",
      });
    }, 2800);
  };

  const handleReset = () => {
    setIsScanning(false);
    setPipelineStep(0);
    setVerificationResult(null);
  };

  return (
    <DashboardShell>
      <div className="space-y-6 font-sans text-slate-800">
        <PageHeader
          title="AI Facial Recognition & Vision Node"
          subtitle="Simulated real-time camera stream, bounding box telemetry, and 5-stage neural embedding pipeline"
          breadcrumb={[{ label: "AI Face Recognition" }]}
          categoryTag="BIOMETRIC COMPUTER VISION"
          action={
            <div className="flex items-center space-x-2">
              <button
                onClick={handleStartScan}
                disabled={isScanning}
                className="px-5 py-2.5 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-xs shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>{isScanning ? "Analyzing Biometrics..." : "Trigger AI Face Verification"}</span>
              </button>
              <button
                onClick={handleReset}
                className="p-2.5 rounded-full bg-white border border-[#E2E8F0] text-slate-600 hover:text-[#0B2C5C] shadow-xs"
                title="Reset Scanner"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Simulated Camera Viewport (Clean Card, No Neon Glow Halo) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-[#0B2C5C]" />
                <h3 className="text-sm font-extrabold text-[#0B2C5C] uppercase tracking-tight">
                  Camera Vision Node (CAM-302-ENTRANCE)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-bold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
                <span>RTSP Stream: 1080p @ 30fps</span>
              </span>
            </div>

            {/* Clean Viewport Card */}
            <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden bg-slate-950 border border-slate-300 shadow-sm flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"
                alt="Face Subject"
                className="w-full h-full object-cover opacity-85"
              />

              {/* Viewport Overlay HUD Grid */}
              <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between text-white font-mono text-[10px]">
                <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded backdrop-blur-xs">
                  <span>SENSOR: SONY-IMX415</span>
                  <span>ISO: 400 • F/1.8</span>
                  <span className="text-emerald-400 font-bold">LIVENESS: ACTIVE</span>
                </div>

                {/* Animated Bounding Box */}
                <div className="relative self-center w-48 h-56 border-2 border-emerald-400 rounded-lg flex items-center justify-center">
                  <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-white" />
                  <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-white" />
                  <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-white" />
                  <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-white" />

                  {isScanning && (
                    <div className="absolute left-0 right-0 h-0.5 bg-[#F4573C] animate-scan-laser shadow-sm" />
                  )}

                  <span className="absolute -bottom-6 bg-black/70 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-bold">
                    {isScanning ? "EXTRACTING LANDMARKS..." : "FACE ALIGNED"}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded backdrop-blur-xs">
                  <span>FACE LANDMARKS: 68-PTS</span>
                  <span>SIMILARITY SCORE: 99.4%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 5-Stage Biometric Pipeline & Match Output */}
          <div className="lg:col-span-5 space-y-5">
            {/* 5-Stage Neural Pipeline */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-[#0B2C5C] uppercase tracking-tight border-b border-slate-100 pb-3">
                5-Stage Neural Biometric Pipeline
              </h3>

              <div className="space-y-3">
                {[
                  { step: 1, title: "1. Face Detection", desc: "RetinaFace landmark localization & crop" },
                  { step: 2, title: "2. Anti-Spoofing Liveness", desc: "Passive texture & IR frequency reflection verification" },
                  { step: 3, title: "3. 512D Vector Embedding", desc: "ArcFace ResNet-100 feature vector generation" },
                  { step: 4, title: "4. Euclidean Cosine Matching", desc: "FAISS index search against enrolled database" },
                  { step: 5, title: "5. ERP Attendance Signed", desc: "Instant timestamp & student presence confirmed" },
                ].map((item) => {
                  const isCurrent = pipelineStep === item.step;
                  const isPast = pipelineStep > item.step;

                  return (
                    <div
                      key={item.step}
                      className={`p-3 rounded-xl border transition-all text-xs flex items-center space-x-3 ${
                        isCurrent
                          ? "bg-[#EEF2F8] border-[#0B2C5C] shadow-xs"
                          : isPast
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-[#F8FAFC] border-[#E2E8F0] text-slate-500"
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                        isCurrent
                          ? "bg-[#0B2C5C] text-white"
                          : isPast
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}>
                        {isPast ? "✓" : item.step}
                      </span>
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900">{item.title}</div>
                        <div className="text-[11px] text-slate-500">{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Verification Result Card */}
            {verificationResult && (
              <div className="bg-white rounded-2xl border border-emerald-300 p-6 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-black text-sm uppercase tracking-wide">
                    Identity Verified & Presence Marked
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="text-base font-black text-[#0B2C5C]">{verificationResult.name}</div>
                  <div className="text-slate-500 font-mono">
                    Roll No: <strong className="text-slate-800">{verificationResult.rollNo}</strong> • {verificationResult.department}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-slate-600">
                    <span>Confidence: <strong className="text-emerald-700">{verificationResult.confidence}%</strong></span>
                    <span>Compute Latency: <strong className="font-mono text-slate-800">{verificationResult.matchTime}</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
