"use client";

import React from "react";
import {
  Radio,
  ScanFace,
  BarChart3,
  ShieldCheck,
  Zap,
  GraduationCap,
  Building2,
} from "lucide-react";
import { LoginCard } from "./LoginCard";
import Link from "next/link";

export const BrandingPanel: React.FC = () => {
  return (
    <div className="w-full flex flex-col font-sans bg-[#F8FAFC] text-slate-800 min-h-screen">
      {/* 1. TOP INSTITUTIONAL UTILITY HEADER (Matches SSN Reference Top Navy Bar) */}
      <div className="w-full bg-[#071E40] text-slate-300 text-xs h-11 flex items-center px-4 sm:px-8 border-b border-[#0B2C5C]">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-extrabold text-white tracking-wide">ANNA UNIVERSITY</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 hidden sm:inline">Centre for e-Governance (CeGov)</span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-cyan-300 font-mono text-[11px] font-bold">SmartAttend IoT v4.2</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span>Broker Active</span>
            </span>
            <span className="text-slate-500">|</span>
            <Link href="/" className="hover:text-white font-sans text-slate-300">
              Public Portal →
            </Link>
          </div>
        </div>
      </div>

      {/* 2. CAMPUS HERO PHOTO BANNER WITH NAVY OVERLAY (Reference Image 1 Hero Style) */}
      <div className="relative w-full bg-[#0B2C5C] py-12 px-4 sm:px-8 overflow-hidden shadow-md">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-white max-w-2xl">
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-cyan-200 border border-white/20 text-[10px] font-mono font-bold uppercase tracking-widest">
              Biometric & RFID Telemetry Gateway
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              SmartAttend Portal Sign In
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              Access real-time lecture attendance records, ESP32 hardware telemetry, and automated condonation risk predictions.
            </p>
          </div>

          <div className="hidden lg:flex items-center space-x-3 text-white">
            <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center">
              <div className="text-xl font-black font-mono">100%</div>
              <div className="text-[10px] uppercase text-cyan-200 font-bold">Realtime</div>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center">
              <div className="text-xl font-black font-mono text-emerald-400">0.4s</div>
              <div className="text-[10px] uppercase text-cyan-200 font-bold">Latency</div>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center">
              <div className="text-xl font-black font-mono text-amber-300">99.8%</div>
              <div className="text-[10px] uppercase text-cyan-200 font-bold">Accuracy</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN SIGN-IN CONTAINER WITH LIGHT CARDS */}
      <div className="w-full flex-1 max-w-7xl mx-auto py-10 px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Informational Overview (Col 7) */}
        <div className="lg:col-span-7 space-y-6 pt-2">
          <div>
            <span className="text-xs font-bold text-[#F4573C] uppercase tracking-wider block mb-1">
              CeGov University Ecosystem
            </span>
            <h2 className="text-2xl font-black text-[#0B2C5C] tracking-tight">
              Integrated Campus Authentication
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              SmartAttend unifies MFRC522 RFID turnstile hardware scanning, camera-based AI face recognition, and university academic condonation auditing in a single light institutional dashboard.
            </p>
          </div>

          {/* Three Clean White Info Cards with Soft Shadows */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-2 hover-lift">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2F8] text-[#0B2C5C] flex items-center justify-center font-bold">
                <Radio className="w-4 h-4 text-[#0B2C5C]" />
              </div>
              <div className="font-extrabold text-xs text-[#0B2C5C]">RFID Turnstiles</div>
              <div className="text-[11px] text-slate-500 leading-snug">
                ESP32 nodes with MFRC522 readers for contactless 0.4s swipes.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-2 hover-lift">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2F8] text-[#0B2C5C] flex items-center justify-center font-bold">
                <ScanFace className="w-4 h-4 text-[#0B2C5C]" />
              </div>
              <div className="font-extrabold text-xs text-[#0B2C5C]">AI Face Vision</div>
              <div className="text-[11px] text-slate-500 leading-snug">
                Camera nodes running 5-stage anti-spoof biometric pipeline.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-2 hover-lift">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2F8] text-[#0B2C5C] flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4 text-[#0B2C5C]" />
              </div>
              <div className="font-extrabold text-xs text-[#0B2C5C]">Condonation Audit</div>
              <div className="text-[11px] text-slate-500 leading-snug">
                Live 75% shortage forecast and automated parent SMS notifications.
              </div>
            </div>
          </div>

          {/* Institutional Compliance Footer Banner */}
          <div className="p-4 rounded-xl bg-[#EEF2F8] border border-[#E2E8F0] flex items-center space-x-3 text-xs text-slate-700">
            <ShieldCheck className="w-5 h-5 text-[#0B2C5C] shrink-0" />
            <span>
              All transactions and attendance records are immutably signed and audit-logged in accordance with Anna University academic regulations.
            </span>
          </div>
        </div>

        {/* Right Form Card (Col 5) */}
        <div className="lg:col-span-5 flex justify-center">
          <LoginCard />
        </div>
      </div>
    </div>
  );
};
