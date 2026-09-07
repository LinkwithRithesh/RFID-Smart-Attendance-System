"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  GraduationCap,
  Calendar,
  Clock,
  CheckSquare,
  FileSpreadsheet,
  FileCheck2,
  Bell,
  HelpCircle,
  Settings,
  LogOut,
  Users,
  BookOpen,
  Radio,
  ScanFace,
  BarChart3,
  Cpu,
  Ticket,
  FileText,
  History,
  Building2,
  ChevronDown,
  ChevronRight,
  X,
  ShieldCheck,
  Shield,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type NavLinkItem = {
  type: "link";
  label: string;
  href: string;
  icon: any;
};

type NavAccordionItem = {
  type: "accordion";
  key: string;
  label: string;
  icon: any;
  children: Array<{ label: string; href: string }>;
};

type NavItem = NavLinkItem | NavAccordionItem;

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role || "STUDENT";

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Profile: true,
    Academics: true,
    Attendance: true,
    Users: true,
    IoT: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 1. CANONICAL STUDENT NAVIGATION TREE
  const studentNav: NavItem[] = [
    { type: "link", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    {
      type: "accordion",
      key: "Profile",
      label: "Profile",
      icon: User,
      children: [
        { label: "View & Update Profile", href: "/profile" },
      ],
    },
    {
      type: "accordion",
      key: "Academics",
      label: "Academics",
      icon: GraduationCap,
      children: [
        { label: "My Timetable", href: "/timetable" },
        { label: "Attendance Details", href: "/attendance" },
        { label: "OD / Leave Requests", href: "/od-requests" },
      ],
    },
    { type: "link", label: "Help Desk", href: "/helpdesk", icon: HelpCircle },
    { type: "link", label: "System Settings", href: "/settings", icon: Settings },
  ];

  // 2. CANONICAL FACULTY NAVIGATION TREE
  const facultyNav: NavItem[] = [
    { type: "link", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { type: "link", label: "Live Attendance Console", href: "/live-attendance", icon: Radio },
    { type: "link", label: "AI Face Recognition", href: "/face-recognition", icon: ScanFace },
    { type: "link", label: "Attendance Verification", href: "/attendance", icon: CheckSquare },
    { type: "link", label: "Class Timetable", href: "/timetable", icon: Calendar },
    { type: "link", label: "Student OD Approvals", href: "/od-requests", icon: FileCheck2 },
    { type: "link", label: "Help Desk", href: "/helpdesk", icon: HelpCircle },
    { type: "link", label: "Settings", href: "/settings", icon: Settings },
  ];

  // 3. CANONICAL ADMIN NAVIGATION TREE
  const adminNav: NavItem[] = [
    { type: "link", label: "Overview Dashboard", href: "/dashboard", icon: LayoutDashboard },
    {
      type: "accordion",
      key: "Users",
      label: "Institutional CRUD",
      icon: Building2,
      children: [
        { label: "Students Directory", href: "/admin/management?tab=students" },
        { label: "Faculty Directory", href: "/admin/management?tab=faculty" },
        { label: "Courses & Sections", href: "/admin/management?tab=courses" },
      ],
    },
    {
      type: "accordion",
      key: "IoT",
      label: "IoT & Hardware Fleet",
      icon: Cpu,
      children: [
        { label: "ESP32 Device Fleet", href: "/devices" },
        { label: "AI Face Recognition", href: "/face-recognition" },
      ],
    },
    { type: "link", label: "OD / Leave Requests", href: "/od-requests", icon: FileCheck2 },
    { type: "link", label: "Help Desk Tickets", href: "/helpdesk", icon: Ticket },
    { type: "link", label: "Audit Logs", href: "/audit-logs", icon: History },
    { type: "link", label: "System Settings", href: "/settings", icon: Settings },
  ];

  const currentNav = role === "ADMIN" ? adminNav : role === "FACULTY" ? facultyNav : studentNav;

  // Role visual identity badge on white surface
  const roleBadgeStyle =
    role === "ADMIN"
      ? { bg: "bg-amber-100 text-amber-900 border-amber-300", icon: Shield }
      : role === "FACULTY"
      ? { bg: "bg-purple-100 text-purple-900 border-purple-300", icon: Users }
      : { bg: "bg-blue-100 text-blue-900 border-blue-300", icon: GraduationCap };

  const RoleIcon = roleBadgeStyle.icon;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#071E40]/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Main Sidebar Shell (Light Institutional Theme) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[250px] bg-white text-slate-700 flex flex-col border-r border-[#E2E8F0] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 min-h-screen text-xs select-none shadow-md ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header / Mobile Close */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] bg-[#FAFCFF]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0B2C5C] text-white flex items-center justify-center font-black text-xs shadow-sm">
              SA
            </div>
            <div>
              <span className="font-extrabold text-sm text-[#0B2C5C] tracking-tight block leading-tight">
                SmartAttend
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Anna University ERP
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Mini Profile Badge (High-Contrast Light Panel) */}
        <div className="p-3 mx-3 my-3 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#0B2C5C] text-white flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0">
            {user?.name ? user.name.charAt(0) : "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-[#0B2C5C] truncate text-xs">{user?.name || "Student User"}</div>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className={`inline-flex items-center space-x-1 px-1.5 py-0.2 rounded text-[9px] font-bold border ${roleBadgeStyle.bg}`}>
                <RoleIcon className="w-2.5 h-2.5" />
                <span>{role}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 truncate">
                {user?.userId || "2025105002"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items Container */}
        <div className="flex-1 overflow-y-auto py-1 px-3 space-y-1">
          {currentNav.map((item, idx) => {
            if (item.type === "link") {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`flex items-center space-x-3 px-3.5 h-[40px] rounded-lg font-semibold transition-all relative ${
                    isActive
                      ? "bg-[#EEF2F8] text-[#0B2C5C] font-bold border-l-4 border-[#0B2C5C] pl-[11px] shadow-xs"
                      : "text-slate-600 hover:bg-[#F8FAFC] hover:text-[#0B2C5C]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#0B2C5C]" : "text-slate-500"}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            }

            const Icon = item.icon;
            const isExpanded = !!openSections[item.key];
            const hasActiveChild = item.children.some((c: { href: string }) => c.href === pathname);
            return (
              <div key={idx} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => toggleSection(item.key!)}
                    className={`w-full flex items-center justify-between px-3.5 h-[40px] rounded-lg font-semibold transition-all ${
                      hasActiveChild
                        ? "bg-[#EEF2F8] text-[#0B2C5C] font-bold"
                        : "text-slate-600 hover:bg-[#F8FAFC] hover:text-[#0B2C5C]"
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <Icon className={`w-4 h-4 ${hasActiveChild ? "text-[#0B2C5C]" : "text-slate-500"}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="pl-9 pr-1 py-1 space-y-1">
                      {item.children.map((child, cIdx) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={cIdx}
                            href={child.href}
                            onClick={() => {
                              if (window.innerWidth < 1024) onClose();
                            }}
                            className={`block py-1.5 px-3 rounded-md transition-colors text-xs ${
                              isChildActive
                                ? "bg-[#0B2C5C] text-white font-bold shadow-xs"
                                : "text-slate-600 hover:bg-slate-100 hover:text-[#0B2C5C]"
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
          })}
        </div>

        {/* Bottom Institutional Info & Logout */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#FAFCFF] space-y-2">
          <div className="flex items-center justify-between text-[11px] px-2 text-slate-500">
            <span className="font-semibold">Turnstile ESP32</span>
            <span className="flex items-center space-x-1 text-emerald-600 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
              <span>Online</span>
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#EF4444] hover:bg-rose-50 hover:border-rose-300 font-bold text-xs transition-colors shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
