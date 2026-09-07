"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";

export function useStudents(options?: {
  role?: string;
  department?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
  });

  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- destructured deps are intentional: `options` is a fresh object literal on every render at the call sites, so depending on it directly would refetch every render.
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getUsers({
        role: options?.role || "STUDENT",
        department: options?.department,
        status: options?.status,
        search: options?.search,
        page: options?.page || 1,
        limit: options?.limit || 10,
      });
      if (res.success) {
        setData(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        setError(res.message || "Failed to load students");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while loading directory");
    } finally {
      setLoading(false);
    }
  }, [
    options?.role,
    options?.department,
    options?.status,
    options?.search,
    options?.page,
    options?.limit,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount; no data-fetching library in this project to move this into.
    fetchStudents();
  }, [fetchStudents]);

  const addStudent = async (studentData: any) => {
    const res = await api.createUser(studentData);
    if (res.success) {
      await fetchStudents();
    }
    return res;
  };

  const updateStudent = async (id: number, studentData: any) => {
    const res = await api.updateUser(id, studentData);
    if (res.success) {
      await fetchStudents();
    }
    return res;
  };

  const deleteStudent = async (id: number) => {
    const res = await api.deleteUser(id);
    if (res.success) {
      await fetchStudents();
    }
    return res;
  };

  return {
    students: data,
    loading,
    error,
    pagination,
    refetch: fetchStudents,
    addStudent,
    updateStudent,
    deleteStudent,
  };
}
