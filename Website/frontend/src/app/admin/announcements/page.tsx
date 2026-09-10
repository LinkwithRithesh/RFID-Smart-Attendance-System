"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Send, Bell } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState("ALL");
  const [category, setCategory] = useState("GENERAL");
  const [priority, setPriority] = useState("NORMAL");

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.getAnnouncements();
      setAnnouncements(res.data || []);
    } catch (error) {
      console.error("Failed to load announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAnnouncement({
        title,
        message,
        targetRole,
        category,
        priority,
      });
      alert("Announcement created successfully.");
      setTitle("");
      setMessage("");
      loadAnnouncements();
    } catch (error: any) {
      console.error(error);
      alert("Failed to create announcement: " + (error.response?.data?.message || error.message));
    }
  };

  if (!user || user.role !== "ADMIN") {
    return (
      <DashboardShell>
        <div className="p-6 text-center text-red-600 font-bold">Access Denied</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6 font-sans text-slate-800">
        <PageHeader
          title="Announcements"
          subtitle="Send notifications and view past announcements"
          breadcrumb={[{ label: "Admin" }, { label: "Announcements" }]}
          categoryTag="COMMUNICATIONS"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Announcement Form */}
          <div className="lg:col-span-1 bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
              <Send className="w-4 h-4 text-[#0B2C5C]" />
              <h3 className="text-sm font-extrabold text-[#0B2C5C] uppercase tracking-tight">New Announcement</h3>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  placeholder="Important Notice..."
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  placeholder="Details..."
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Audience</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <option value="ALL">All (Public/Everyone)</option>
                  <option value="STUDENT">Students Only</option>
                  <option value="FACULTY">Faculty Only</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <option value="GENERAL">General</option>
                  <option value="CIRCULAR">Circular</option>
                  <option value="ALERT">Alert</option>
                  <option value="EXAM">Exam</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 rounded-full bg-[#0B2C5C] hover:bg-[#071E40] text-white font-black text-sm shadow-md transition-all"
              >
                Send Notification
              </button>
            </form>
          </div>

          {/* Past Announcements List */}
          <div className="lg:col-span-2 bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
              <Bell className="w-4 h-4 text-[#0B2C5C]" />
              <h3 className="text-sm font-extrabold text-[#0B2C5C] uppercase tracking-tight">Recent Announcements</h3>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-500 font-medium text-xs">Loading...</div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-8 text-slate-500 font-medium text-xs bg-slate-50 rounded-xl">
                No announcements found.
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-sm text-[#0B2C5C]">{a.title}</h4>
                        <p className="text-[10px] font-bold text-slate-500 font-mono mt-0.5">
                          REF: {a.referenceNo} • {new Date(a.dateIssued).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-md uppercase">
                          Target: {a.targetRole}
                        </span>
                        <span className={`px-2 py-0.5 font-bold text-[10px] rounded-md uppercase ${
                          a.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                          a.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {a.priority}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap">{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
