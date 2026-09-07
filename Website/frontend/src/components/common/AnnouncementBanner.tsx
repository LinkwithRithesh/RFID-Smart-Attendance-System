"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, ChevronRight, X, Sparkles, FileText, Calendar } from "lucide-react";
import { api } from "@/services/api";

export const AnnouncementBanner: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    api
      .getAnnouncements()
      .then((res) => {
        if (res.success && res.data) {
          setAnnouncements(res.data);
        }
      })
      .catch((err) => console.log("Failed to load announcements banner:", err));
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [announcements]);

  if (dismissed || announcements.length === 0) return null;

  const current = announcements[currentIndex] || announcements[0];

  return (
    <>
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-blue-950 text-white border-b border-blue-800 px-4 py-2.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0 mr-4">
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold tracking-wider uppercase shrink-0">
              <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>CeGov Live Circular</span>
            </div>
            <div className="flex items-center space-x-2 truncate">
              <span className="font-mono text-xs text-blue-300 font-medium shrink-0">
                [{current.referenceNo}]
              </span>
              <span className="text-xs sm:text-sm font-semibold truncate">
                {current.title}
              </span>
              <span className="hidden lg:inline text-xs text-blue-200/80 truncate">
                — {current.message}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <span>View All Notice Board</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-blue-300 hover:text-white rounded"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-5 bg-blue-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-white/10">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    Anna University • CeGov e-Governance Circular Board
                  </h3>
                  <p className="text-xs text-blue-200">
                    Official Institutional Notice Board & Campus Circulars
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-blue-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 divide-y divide-slate-100 dark:divide-slate-800">
              {announcements.map((a, i) => (
                <div key={a.id || i} className="pt-4 first:pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {a.referenceNo}
                      </span>
                      {a.priority === "URGENT" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                          URGENT CIRCULAR
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-slate-400 space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{a.dateIssued}</span>
                    </div>
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                    {a.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {a.message}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-400 font-medium">
                    Issued by: {a.issuedBy} • Target: {a.targetRole}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs"
              >
                Close Notice Board
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
