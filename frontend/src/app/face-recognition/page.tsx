"use client";

import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ScanFace, Cpu, ShieldCheck } from "lucide-react";

export default function FaceRecognitionPage() {
  return (
    <DashboardShell>
      <div className="space-y-6 font-sans text-slate-800">
        <PageHeader
          title="AI Facial Recognition & Vision Node"
          subtitle="Biometric computer vision & neural embedding pipeline"
          breadcrumb={[{ label: "AI Face Recognition" }]}
          categoryTag="BIOMETRIC COMPUTER VISION"
        />
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 shadow-xs text-center max-w-2xl mx-auto space-y-4 my-8">

          <div className="w-16 h-16 bg-[#0B2C5C]/10 text-[#0B2C5C] rounded-full flex items-center justify-center mx-auto">
            <ScanFace className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-[#0B2C5C]">AI Facial Recognition Module — Coming Soon</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            The biometric computer vision pipeline and local RTSP camera streaming node integration are currently under scheduled maintenance. RFID multi-factor verification remains fully active across all campus turnstiles.
          </p>
          <div className="pt-4 flex justify-center space-x-6 text-xs font-bold text-slate-500">
            <div className="flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-[#0B2C5C]" />
              <span>RetinaFace & FAISS Vector Search</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

