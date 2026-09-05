"use client";

import React, { useState, useEffect } from "react";
import { Bell, ShieldAlert, ChevronRight } from "lucide-react";
import { api } from "@/services/api";

export const AnnouncementCard: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    api
      .getAnnouncements()
      .then((res) => {
        if (res.success && res.data) {
          setAnnouncements(res.data.slice(0, 2));
        }
      })
      .catch((err) => console.log("Login announcement card:", err));
  }, []);

  if (announcements.length === 0) return null;

  return (
    <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
      <div className="flex items-center space-x-2 mb-2">
        <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          CeGov Notice Board
        </span>
      </div>
      <div className="space-y-2">
        {announcements.map((a, idx) => (
          <div key={idx} className="text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                {a.title}
              </span>
              <span className="text-[10px] text-slate-400 shrink-0 ml-2 font-mono">
                {a.referenceNo}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
              {a.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
