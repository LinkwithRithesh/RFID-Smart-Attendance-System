"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Radio,
  ScanFace,
  Zap,
  ShieldCheck,
  BarChart3,
  Cpu,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Users,
  Shield,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";

const campusHeroImg = "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1600&q=80";

export default function PublicLandingPage() {
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev % 5) + 1);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-[#0B2C5C] selection:text-white">
      {/* 1. PUBLIC INSTITUTIONAL HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] h-16 flex items-center px-6 shadow-xs">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#0B2C5C] text-white flex items-center justify-center font-black text-sm shadow-xs">
              AU
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-tight text-[#0B2C5C]">SmartAttend</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EEF2F8] text-[#0B2C5C] uppercase tracking-wider">
                  IoT v4.2
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block font-semibold">
                ANNA UNIVERSITY BIOMETRIC ERP
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-7 text-xs font-bold text-slate-600">
            <a href="#hero" className="hover:text-[#0B2C5C] transition-colors">Home</a>
            <a href="#architecture" className="hover:text-[#0B2C5C] transition-colors">IoT Pipeline</a>
            <a href="#portals" className="hover:text-[#0B2C5C] transition-colors">Role Portals</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-xs shadow-xs hover:shadow transition-all flex items-center space-x-2"
            >
              <span>Launch ERP Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION WITH CAMPUS BANNER & NAVY GRADIENT OVERLAY (Reference Image 1) */}
      <section id="hero" className="relative pt-16 pb-20 px-6 overflow-hidden bg-[#0B2C5C] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
          style={{ backgroundImage: `url('${campusHeroImg}')` }}
        />
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-cyan-200 text-xs font-extrabold uppercase tracking-widest">
            <span>Unified University Attendance Ecosystem</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            High-Speed Biometric RFID & AI Face Vision Attendance
          </h1>

          <p className="text-sm sm:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed">
            Enterprise university attendance portal powering real-time lecture swipes, turnstile hardware telemetry, and automated condonation auditing.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-sm shadow-md transition-all flex items-center space-x-2"
            >
              <span>Explore Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#architecture"
              className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm transition-colors"
            >
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* 3. QUICK STATS STRIP (Clean White Surface) */}
      <section className="bg-white border-b border-[#E2E8F0] py-6 px-6 shadow-xs">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#0B2C5C] font-mono">0.4s</div>
            <div className="text-xs font-bold text-slate-500 uppercase mt-0.5">Turnstile Latency</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">99.8%</div>
            <div className="text-xs font-bold text-slate-500 uppercase mt-0.5">Matching Accuracy</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#0B2C5C] font-mono">3,840+</div>
            <div className="text-xs font-bold text-slate-500 uppercase mt-0.5">Active Students</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#0B2C5C] font-mono">48</div>
            <div className="text-xs font-bold text-slate-500 uppercase mt-0.5">ESP32 Fleet Nodes</div>
          </div>
        </div>
      </section>

      {/* 4. 5-STAGE ARCHITECTURE PIPELINE (Alternating light navy-tinted panel #EEF2F8) */}
      <section id="architecture" className="py-16 px-6 bg-[#EEF2F8]">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#F4573C] uppercase tracking-wider block mb-1">
              End-to-End IoT Pipeline
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B2C5C] tracking-tight">
              From Turnstile Sensor to University ERP
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Automated 5-stage telemetric verification workflow ensuring tamper-proof attendance recording.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { num: 1, title: "ESP32 Node", desc: "MFRC522 RFID card scan or camera face detection at turnstile" },
              { num: 2, title: "MQTT Broker", desc: "Encrypted lightweight telemetry published over university Wi-Fi" },
              { num: 3, title: "FastAPI Engine", desc: "Biometric matching, duplicate debounce, and database commit" },
              { num: 4, title: "Web ERP Portal", desc: "Live student dashboard update and faculty roster synchronization" },
              { num: 5, title: "Parent SMS", desc: "Automated instant SMS dispatch for absence or 75% shortage alert" },
            ].map((step) => {
              const isActive = activeStep === step.num;
              return (
                <div
                  key={step.num}
                  onClick={() => setActiveStep(step.num)}
                  className={`p-4 rounded-xl transition-all cursor-pointer bg-white border ${
                    isActive
                      ? "border-[#0B2C5C] shadow-md ring-2 ring-[#0B2C5C]/20"
                      : "border-[#E2E8F0] shadow-xs hover:border-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                      isActive ? "bg-[#0B2C5C] text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      {step.num}
                    </span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
                    )}
                  </div>
                  <div className="font-extrabold text-xs text-[#0B2C5C] mb-1">{step.title}</div>
                  <div className="text-[11px] text-slate-500 leading-snug">{step.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. DIRECT ROLE PORTAL SWITCHER (White Surface) */}
      <section id="portals" className="py-16 px-6 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#F4573C] uppercase tracking-wider block mb-1">
              Role Portals
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B2C5C] tracking-tight">
              Select Your University Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              One-click access with pre-configured verified credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs hover-lift flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#EEF2F8] text-[#0B2C5C] flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-[#0B2C5C]">Student Portal</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Monitor live lecture attendance %, timetable, shortage risk alerts, and submit online OD/leave applications.
                </p>
              </div>
              <Link
                href="/login"
                className="w-full py-2.5 rounded-full bg-[#0B2C5C] hover:bg-[#071E40] text-white font-bold text-xs text-center transition-colors shadow-xs"
              >
                Sign In as Student
              </Link>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs hover-lift flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#EEF2F8] text-[#0B2C5C] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-[#0B2C5C]">Faculty Console</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Launch real-time class attendance session, live swipe feeds, AI face vision, and review pending OD certificates.
                </p>
              </div>
              <Link
                href="/login"
                className="w-full py-2.5 rounded-full bg-[#0B2C5C] hover:bg-[#071E40] text-white font-bold text-xs text-center transition-colors shadow-xs"
              >
                Sign In as Faculty
              </Link>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs hover-lift flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#EEF2F8] text-[#0B2C5C] flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-[#0B2C5C]">Admin & IoT Control</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Manage university student/faculty records, ESP32 fleet nodes, buzzer tests, and immutable system audit logs.
                </p>
              </div>
              <Link
                href="/login"
                className="w-full py-2.5 rounded-full bg-[#0B2C5C] hover:bg-[#071E40] text-white font-bold text-xs text-center transition-colors shadow-xs"
              >
                Sign In as Administrator
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#071E40] text-slate-400 py-8 px-6 border-t border-[#0B2C5C] text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-white">SmartAttend</span> • Centre for e-Governance, Anna University.
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Powered by ESP32 + MQTT + FastAPI Biometric Suite
          </div>
        </div>
      </footer>
    </div>
  );
}
