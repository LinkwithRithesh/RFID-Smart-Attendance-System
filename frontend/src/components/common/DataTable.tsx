"use client";

import React, { useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: keyof T;
  isLoading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  emptyTitle?: string;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = "id" as keyof T,
  isLoading = false,
  pagination,
  emptyTitle,
  emptyMessage,
}: DataTableProps<T>) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortField === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(key);
      setSortDir("asc");
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      const comp = aVal > bVal ? 1 : -1;
      return sortDir === "asc" ? comp : -comp;
    });
  }, [data, sortField, sortDir]);

  return (
    <div className="glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-md overflow-hidden transition-all">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-800/60">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => handleSort(String(col.key), col.sortable)}
                  className={`px-4 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 ${
                    col.sortable
                      ? "cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors select-none"
                      : ""
                  } ${col.className || ""}`}
                >
                  <div className="flex items-center space-x-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <ArrowUpDown
                        className={`w-3.5 h-3.5 ${
                          sortField === col.key
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-400"
                        }`}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-4 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <EmptyState title={emptyTitle} message={emptyMessage} />
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr
                  key={String(row[keyField] || idx)}
                  className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`px-4 py-3.5 text-xs font-medium text-slate-700 dark:text-slate-300 ${
                        col.className || ""
                      }`}
                    >
                      {col.render
                        ? col.render(row)
                        : row[col.key as keyof T] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 text-xs text-slate-600 dark:text-slate-400">
          <span className="font-medium">
            Page{" "}
            <strong className="font-extrabold text-slate-900 dark:text-white">
              {pagination.page}
            </strong>{" "}
            of{" "}
            <strong className="font-extrabold text-slate-900 dark:text-white">
              {pagination.totalPages}
            </strong>{" "}
            ({pagination.totalCount} records)
          </span>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: pagination.totalPages }).map((_, i) => {
              const pNum = i + 1;
              if (
                pNum === 1 ||
                pNum === pagination.totalPages ||
                Math.abs(pNum - pagination.page) <= 1
              ) {
                return (
                  <button
                    key={pNum}
                    onClick={() => pagination.onPageChange(pNum)}
                    className={`px-3 py-1 rounded-xl border text-xs font-bold transition-all ${
                      pNum === pagination.page
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {pNum}
                  </button>
                );
              }
              if (
                pNum === pagination.page - 2 ||
                pNum === pagination.page + 2
              ) {
                return <span key={pNum} className="px-1 text-slate-400 font-mono">…</span>;
              }
              return null;
            })}
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
