"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UiRole } from "@/context/AuthContext";
import { Sidebar } from "@/components/common/Sidebar";
import { Navbar } from "@/components/common/Navbar";
import { AnnouncementBanner } from "@/components/common/AnnouncementBanner";
import { Loader } from "@/components/common/Loader";
import { EmptyState } from "@/components/common/EmptyState";
import { ShieldAlert } from "lucide-react";

interface DashboardShellProps {
  children: React.ReactNode;
  allowedRoles?: UiRole[];
}

export function DashboardShell({ children, allowedRoles }: DashboardShellProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader text="Loading SmartAttend Portal..." />
      </div>
    );
  }

  const isAllowed = !allowedRoles || allowedRoles.includes(user.role);

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-800 font-sans">
      {/* Institutional Left Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
        <AnnouncementBanner />
        <main className="flex-1 p-4 sm:p-7 max-w-7xl w-full mx-auto">
          {isAllowed ? (
            children
          ) : (
            <EmptyState
              icon={<ShieldAlert className="w-8 h-8 text-[#EF4444]" />}
              title="Access restricted"
              message={`Your role (${user.role}) does not have access to this institutional module.`}
            />
          )}
        </main>
      </div>
    </div>
  );
}
