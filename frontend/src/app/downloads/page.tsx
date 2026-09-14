"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { Loader } from "@/components/common/Loader";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Download, Upload } from "lucide-react";

interface DocumentRow {
  id: number;
  title: string;
  code: string;
  category: string;
  description: string;
  fileSize: string;
  downloadsCount: number;
}

function UploadForm({ onUploaded }: { onUploaded: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("CERTIFICATE");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please choose a file");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("code", code);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("file", file);
      await api.createDocument(formData);
      setTitle("");
      setCode("");
      setDescription("");
      setFile(null);
      setOpen(false);
      onUploaded();
    } catch (err: any) {
      setError(err.message || "Failed to upload document");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
      >
        <Upload className="w-4 h-4" />
        <span>Upload Document</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-4 space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Bonafide Certificate)"
          className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg" />
        <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (e.g. FORM-AU-01)"
          className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg" />
      </div>
      <select value={category} onChange={(e) => setCategory(e.target.value)}
        className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg">
        <option value="CERTIFICATE">Certificate</option>
        <option value="LEAVE">Leave</option>
        <option value="CIRCULAR">Circular</option>
        <option value="GUIDELINES">Guidelines</option>
      </select>
      <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description"
        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg" rows={2} />
      <input required type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="text-sm text-slate-600 dark:text-slate-300" />
      <div className="flex items-center space-x-2">
        <button type="submit" disabled={submitting}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
          {submitting ? "Uploading..." : "Upload"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </form>
  );
}

function DownloadsContent() {
  const { user, token } = useAuth();
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getDocuments();
      setDocuments(res.data || []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount; no data-fetching library in this project to move this into.
    load();
  }, [load]);

  const handleDownload = async (id: number, code: string) => {
    const { downloadUrl } = await api.incrementDocumentDownload(id);
    // The download endpoint requires the auth header, so fetch as a blob
    // rather than a plain <a href> navigation (which can't attach headers).
    const res = await fetch(downloadUrl, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = code;
    a.click();
    window.URL.revokeObjectURL(url);
    load(); // refresh so the download count updates
  };

  const canUpload = user?.role === "ADMIN" || user?.role === "FACULTY";

  const columns: Column<DocumentRow>[] = [
    { key: "title", header: "Title", sortable: true },
    { key: "code", header: "Code" },
    { key: "category", header: "Category" },
    { key: "fileSize", header: "Size" },
    { key: "downloadsCount", header: "Downloads" },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <button
          onClick={() => handleDownload(r.id, r.code)}
          className="flex items-center space-x-1 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download</span>
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Circulars & Downloads"
        subtitle="Official forms, certificates, and circulars"
        breadcrumb={[{ label: "Circulars & Downloads" }]}
        action={canUpload ? <UploadForm onUploaded={load} /> : undefined}
      />

      {loading ? (
        <Loader text="Loading documents..." />
      ) : (
        <DataTable
          columns={columns}
          data={documents}
          isLoading={false}
          emptyTitle="No documents available"
          emptyMessage="Uploaded circulars and forms will appear here."
        />
      )}
    </>
  );
}

export default function DownloadsPage() {
  return (
    <DashboardShell>
      <DownloadsContent />
    </DashboardShell>
  );
}
