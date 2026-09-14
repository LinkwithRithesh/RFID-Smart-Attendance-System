"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { mockService } from "@/services/mockServices";
import { NotificationItem } from "@/services/mockData";

export const NotificationBadge: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const role = user?.role || "STUDENT";
    const updateList = () => {
      setNotifications(mockService.getNotifications(role));
    };

    updateList();
    const unsubscribe = mockService.subscribe(updateList);
    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    const role = user?.role || "STUDENT";
    mockService.markAllNotificationsRead(role);
  };

  const handleMarkOneRead = (id: string) => {
    mockService.markNotificationRead(id);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg border border-[#E2E8F0] text-slate-600 hover:text-[#0B2C5C] hover:bg-slate-100 transition-colors relative"
        title="Institutional Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#F4573C] text-white font-mono text-[9px] font-black shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-50 overflow-hidden text-slate-800">
            {/* Header */}
            <div className="p-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-[#0B2C5C]" />
                <span className="font-extrabold text-xs text-[#0B2C5C] uppercase tracking-wider">
                  Notifications & Alerts
                </span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#F4573C] text-white font-mono text-[10px] font-bold">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#0B2C5C] hover:underline font-bold flex items-center space-x-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Read all</span>
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No notifications recorded.
                </div>
              ) : (
                notifications.map((item) => {
                  const isUnread = !item.read;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleMarkOneRead(item.id)}
                      className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-50 flex items-start space-x-3 text-xs ${
                        isUnread ? "bg-[#EEF2F8]/60 font-medium" : "text-slate-600"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {item.type === "CRITICAL" ? (
                          <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                        ) : item.type === "WARNING" ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        ) : item.type === "SUCCESS" ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Info className="w-4 h-4 text-[#0B2C5C]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate text-[11px]">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                          {item.message}
                        </p>
                      </div>

                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#F4573C] shrink-0 self-center" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] text-center text-[10px] text-slate-500 font-medium">
              Synchronized with SmartAttend IoT Notification Engine
            </div>
          </div>
        </>
      )}
    </div>
  );
};
