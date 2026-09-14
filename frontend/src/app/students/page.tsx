"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { SearchBox } from "@/components/common/SearchBox";
import { StatusChip } from "@/components/common/StatusChip";
import { useStudents } from "@/hooks/useStudents";
import { usePagination } from "@/hooks/usePagination";

interface StudentRow {
  id: number;
  userId: string;
  name: string;
  email: string;
  department: string;
  semester?: number;
  status?: string;
}

function StudentsContent() {
  const [search, setSearch] = useState("");
  const { page, limit, goToPage } = usePagination(10);
  const { students, loading, pagination } = useStudents({ role: "STUDENT", search, page, limit });

  const columns: Column<StudentRow>[] = [
    { key: "userId", header: "Roll Number", sortable: true },
    { key: "name", header: "Name", sortable: true },
    { key: "email", header: "Email" },
    { key: "department", header: "Department" },
    { key: "semester", header: "Semester", render: (r) => r.semester ?? "—" },
    { key: "status", header: "Status", render: (r) => <StatusChip status={r.status || "ACTIVE"} size="sm" /> },
  ];

  return (
    <>
      <PageHeader
        title="Students Directory"
        subtitle="All registered students across departments"
        breadcrumb={[{ label: "Students Directory" }]}
      />

      <div className="mb-4">
        <SearchBox value={search} onChange={setSearch} placeholder="Search students by name, roll number..." className="max-w-md" />
      </div>

      <DataTable
        columns={columns}
        data={students}
        isLoading={loading}
        pagination={{ ...pagination, onPageChange: goToPage }}
        emptyTitle="No students found"
        emptyMessage="No students match your current search."
      />
    </>
  );
}

export default function StudentsPage() {
  return (
    <DashboardShell allowedRoles={["ADMIN", "FACULTY"]}>
      <StudentsContent />
    </DashboardShell>
  );
}
