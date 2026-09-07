"use client";

import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, Shield, KeyRound, Bell } from "lucide-react";

function SettingsContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      <PageHeader
        title="Institutional Account & Security Settings"
        subtitle="Manage user session security, verified credentials, and communication preferences"
        breadcrumb={[{ label: "Account Settings" }]}
        categoryTag="SECURITY & PREFERENCES"
      />

      <div className="max-w-2xl space-y-5">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-[#0B2C5C]" />
            <h3 className="text-sm font-extrabold text-[#0B2C5C]">Verified User Identity</h3>
          </div>
          <dl className="grid grid-cols-3 gap-y-3 text-xs">
            <dt className="text-slate-500 font-bold">Full Name</dt>
            <dd className="col-span-2 text-slate-900 font-bold">{user?.name}</dd>
            <dt className="text-slate-500 font-bold">Email Address</dt>
            <dd className="col-span-2 text-slate-900">{user?.email}</dd>
            <dt className="text-slate-500 font-bold">Institutional ID</dt>
            <dd className="col-span-2 text-[#0B2C5C] font-mono font-bold">{user?.userId}</dd>
            <dt className="text-slate-500 font-bold">Role Privilege</dt>
            <dd className="col-span-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EEF2F8] text-[#0B2C5C]">
                {user?.role}
              </span>
            </dd>
            <dt className="text-slate-500 font-bold">Department</dt>
            <dd className="col-span-2 text-slate-900">{user?.department || "General Engineering"}</dd>
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs flex items-center justify-between">
          <div>
            <div className="font-extrabold text-sm text-[#0B2C5C]">Active University Session</div>
            <p className="text-xs text-slate-500 mt-0.5">Secure JWT authentication token with 8-hour expiry</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-5 py-2.5 text-xs font-black text-white bg-[#EF4444] hover:bg-rose-600 rounded-full shadow-xs transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <DashboardShell>
      <SettingsContent />
    </DashboardShell>
  );
}
