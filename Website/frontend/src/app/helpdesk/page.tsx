"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { mockService } from "@/services/mockServices";
import { HelpDeskTicket } from "@/services/mockData";
import {
  HelpCircle,
  Plus,
  MessageSquare,
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  User,
  Shield,
  ChevronRight,
} from "lucide-react";

export default function HelpDeskPage() {
  const { user } = useAuth();
  const role = user?.role || "STUDENT";
  const userId = user?.userId || "2025105002";
  const userName = user?.name || "Student User";

  const [tickets, setTickets] = useState<HelpDeskTicket[]>(() =>
    mockService.getTickets(role as any, userId)
  );
  const [selectedTicket, setSelectedTicket] = useState<HelpDeskTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New ticket state
  const [category, setCategory] = useState<HelpDeskTicket["category"]>("RFID Hardware");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<HelpDeskTicket["priority"]>("HIGH");
  const [initialMessage, setInitialMessage] = useState("");

  useEffect(() => {
    const update = () => {
      const all = mockService.getTickets(role as any, userId);
      setTickets(all);
      if (selectedTicket) {
        const found = all.find((t) => t.id === selectedTicket.id);
        if (found) setSelectedTicket(found);
      }
    };
    const unsubscribe = mockService.subscribe(update);
    return () => unsubscribe();
  }, [role, userId, selectedTicket]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const created = mockService.createTicket({
      creatorId: userId,
      creatorName: userName,
      creatorRole: role as any,
      category,
      priority,
      subject,
      initialMessage,
    });
    setShowCreateModal(false);
    setSubject("");
    setInitialMessage("");
    setSelectedTicket(created);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    mockService.replyToTicket(selectedTicket.id, {
      senderName: userName,
      senderRole: role as any,
      text: replyMessage,
    });
    setReplyMessage("");
  };

  const handleResolveTicket = (ticketId: string) => {
    mockService.updateTicketStatus(ticketId, "RESOLVED", {
      user: userName,
      role: role as any,
    });
  };

  return (
    <DashboardShell>
      <div className="space-y-6 font-sans text-slate-800">
        <PageHeader
          title="Campus Support & Help Desk Ticketing"
          subtitle="Submit technical tickets for RFID card replacements, biometric vision re-enrollment, and attendance corrections"
          breadcrumb={[{ label: "Support Help Desk" }]}
          categoryTag="STUDENT & FACULTY ASSISTANCE"
          action={
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black text-xs shadow-md transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Raise Support Ticket</span>
            </button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Tickets List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <span className="font-extrabold text-xs text-[#0B2C5C] uppercase tracking-wider">
                  Active Support Queue ({tickets.length})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Real-time sync</span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {tickets.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No support tickets found.
                  </div>
                ) : (
                  tickets.map((t) => {
                    const isSelected = selectedTicket?.id === t.id;
                    const isResolved = t.status === "RESOLVED";

                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                          isSelected
                            ? "bg-[#EEF2F8] border-[#0B2C5C] shadow-xs"
                            : "bg-[#F8FAFC] border-[#E2E8F0] hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-slate-500">
                            {t.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              isResolved
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : t.priority === "CRITICAL"
                                ? "bg-rose-100 text-[#EF4444] border border-rose-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300"
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>

                        <div className="font-bold text-slate-900 truncate">{t.subject}</div>

                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span>{t.creatorName} ({t.creatorRole})</span>
                          <span>{t.updatedAt}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Selected Ticket Conversation Thread */}
          <div className="lg:col-span-7">
            {selectedTicket ? (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-[#0B2C5C] bg-[#EEF2F8] px-2 py-0.5 rounded">
                        {selectedTicket.id}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        Category: {selectedTicket.category}
                      </span>
                    </div>
                    <h2 className="text-base font-black text-[#0B2C5C] mt-1">
                      {selectedTicket.subject}
                    </h2>
                  </div>

                  {selectedTicket.status !== "RESOLVED" && role === "ADMIN" && (
                    <button
                      onClick={() => handleResolveTicket(selectedTicket.id)}
                      className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                    >
                      Mark as Resolved
                    </button>
                  )}
                </div>

                {/* Message Bubble Thread */}
                <div className="space-y-3 max-h-80 overflow-y-auto p-2">
                  {selectedTicket.messages.map((m) => {
                    const isMe = m.senderName === userName || m.senderRole === role;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] p-3.5 rounded-2xl text-xs space-y-1 shadow-xs ${
                            isMe
                              ? "bg-[#0B2C5C] text-white rounded-br-none"
                              : "bg-[#F1F5F9] text-slate-800 rounded-bl-none border border-[#E2E8F0]"
                          }`}
                        >
                          <div className={`flex justify-between items-center text-[10px] space-x-3 ${isMe ? "text-slate-200" : "text-slate-500"}`}>
                            <span className="font-bold">{m.senderName} ({m.senderRole})</span>
                            <span className="font-mono">{m.timestamp}</span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    required
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your response message..."
                    className="flex-1 px-4 py-2.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-slate-900 focus:outline-none focus:border-[#0B2C5C]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-full bg-[#0B2C5C] hover:bg-[#071E40] text-white font-black text-xs flex items-center space-x-1.5 shadow-xs"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center text-slate-400 text-xs shadow-xs">
                Select a support ticket from the list to view the full dialogue thread.
              </div>
            )}
          </div>
        </div>

        {/* Create Ticket Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071E40]/60 backdrop-blur-xs p-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-[#0B2C5C]">Create New Support Ticket</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Issue Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <option value="RFID Hardware">RFID Card Malfunction / Lost Tag</option>
                    <option value="AI Face Recognition">Facial Scanner False Negative</option>
                    <option value="Attendance Discrepancy">Attendance Correction Request</option>
                    <option value="Portal Access">Login / Password / Account Access</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief description of the problem"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Message Details</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide roll number, classroom room number, timestamp, and details..."
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#F4573C] hover:bg-[#E64A19] text-white font-black shadow-md"
                  >
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
