"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { SearchBox } from "@/components/common/SearchBox";
import { StatusChip } from "@/components/common/StatusChip";
import { useStudents } from "@/hooks/useStudents";
import { usePagination } from "@/hooks/usePagination";

interface FacultyRow {
  id: number;
  userId: string;
  name: string;
  email: string;
  department: string;
  status?: string;
}

function FacultyContent() {
  const [search, setSearch] = useState("");
  const { page, limit, goToPage } = usePagination(10);
  const { students: faculty, loading, pagination } = useStudents({ role: "FACULTY", search, page, limit });

  const columns: Column<FacultyRow>[] = [
    { key: "userId", header: "Employee ID", sortable: true },
    { key: "name", header: "Name", sortable: true },
    { key: "email", header: "Email" },
    { key: "department", header: "Department" },
    { key: "status", header: "Status", render: (r) => <StatusChip status={r.status || "ACTIVE"} size="sm" /> },
  ];

  return (
    <>
      <PageHeader
        title="Faculty Directory"
        subtitle="All teaching staff across departments"
        breadcrumb={[{ label: "Faculty Directory" }]}
      />

      <div className="mb-4">
        <SearchBox value={search} onChange={setSearch} placeholder="Search faculty by name, employee ID..." className="max-w-md" />
      </div>

      <DataTable
        columns={columns}
        data={faculty}
        isLoading={loading}
        pagination={{ ...pagination, onPageChange: goToPage }}
        emptyTitle="No faculty found"
        emptyMessage="No faculty members match your current search."
      />
    </>
  );
}

export default function FacultyPage() {
  return (
    <DashboardShell allowedRoles={["ADMIN", "FACULTY"]}>
      <FacultyContent />
    </DashboardShell>
  );
}
