"use client";

import React, { useState, useEffect } from "react";
import { Activity, CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "@/services/api";

export const SystemStatus: React.FC = () => {
  const [onlineCount, setOnlineCount] = useState(5);
  const [totalCount, setTotalCount] = useState(6);

  useEffect(() => {
    api
      .getDevices()
      .then((res) => {
        if (res.success && res.data) {
          const online = res.data.filter(
            (d: any) => d.status === "ONLINE"
          ).length;
          setOnlineCount(online);
          setTotalCount(res.data.length);
        }
      })
      .catch((e) => console.log("Login system status:", e));
  }, []);

  const allOnline = onlineCount === totalCount;

  return (
    <div className="mt-4 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs">
      <div className="flex items-center space-x-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="font-semibold text-emerald-800 dark:text-emerald-300">
          CeGov Edge Network Online
        </span>
      </div>
      <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
        {onlineCount}/{totalCount} Gate Controllers Active
      </span>
    </div>
  );
};
