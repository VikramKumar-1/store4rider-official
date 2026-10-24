"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowTopRightOnSquareIcon,
  TagIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { IContactIssue } from "@store4riders/shared-types";
import { useAdminUpdateContactStatus, useAdminAddContactNote } from "@/core/hooks/useContactIssues";

interface ContactIssueDetailModalProps {
  issue: IContactIssue | null;
  onClose: () => void;
  onOpenOrder?: (orderNumber: string) => void;
}

export const ContactIssueDetailModal: React.FC<ContactIssueDetailModalProps> = ({
  issue,
  onClose,
  onOpenOrder,
}) => {
  const [newNote, setNewNote] = useState("");
  const updateStatusMutation = useAdminUpdateContactStatus();
  const addNoteMutation = useAdminAddContactNote();

  if (!issue) return null;

  const cleanPhone = (issue.phone || "").replace(/[^0-9]/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleStatusChange = (status: "open" | "in_progress" | "resolved" | "closed") => {
    updateStatusMutation.mutate({
      id: issue.id,
      data: { status },
    });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNoteMutation.mutate(
      { id: issue.id, text: newNote.trim() },
      {
        onSuccess: () => {
          setNewNote("");
        },
      }
    );
  };

  const handleWhatsAppCustomer = () => {
    if (!issue.phone) {
      toast.error("Customer phone number is missing");
      return;
    }
    let msg = `*Store4Riders Customer Care*\n\n`;
    msg += `Hello *${issue.name}*,\n`;
    msg += `Thank you for contacting Store4Riders support regarding ticket *#${issue.ticketId}*.\n\n`;
    msg += `📌 *Subject:* ${issue.subject}\n`;
    if (issue.orderNumber) {
      msg += `📦 *Order Ref:* #${issue.orderNumber}\n`;
    }
    msg += `\nWe are here to assist you with your inquiry. Please let us know how we can help!\n\nBest regards,\nStore4Riders Support Team`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Open / Pending</span>;
      case "in_progress":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">In Progress</span>;
      case "resolved":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Resolved</span>;
      case "closed":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Closed</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-brand/10 text-brand">
              <ExclamationCircleIcon className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base sm:text-lg">Ticket #{issue.ticketId}</h3>
                {getStatusBadge(issue.status)}
              </div>
              <p className="text-xs text-slate-500">Contact Us Customer Inquiry</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(issue.ticketId, "Ticket ID")}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
              title="Copy Ticket ID"
            >
              <ClipboardDocumentIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Status Progression Controls */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px]">Update Ticket Status:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleStatusChange("open")}
                disabled={issue.status === "open" || updateStatusMutation.isPending}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  issue.status === "open" ? "bg-amber-600 text-white" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Open
              </button>
              <button
                onClick={() => handleStatusChange("in_progress")}
                disabled={issue.status === "in_progress" || updateStatusMutation.isPending}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  issue.status === "in_progress" ? "bg-blue-600 text-white" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => handleStatusChange("resolved")}
                disabled={issue.status === "resolved" || updateStatusMutation.isPending}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  issue.status === "resolved" ? "bg-emerald-600 text-white" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Mark Resolved
              </button>
              <button
                onClick={() => handleStatusChange("closed")}
                disabled={issue.status === "closed" || updateStatusMutation.isPending}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  issue.status === "closed" ? "bg-slate-800 text-white" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Close
              </button>
            </div>
          </div>

          {/* Customer Details Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div>
                <span className="text-slate-400 block text-[11px]">Customer Name</span>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-brand" />
                  {issue.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Email</span>
                <a href={`mailto:${issue.email}`} className="font-semibold text-brand hover:underline flex items-center gap-1">
                  <EnvelopeIcon className="w-3.5 h-3.5" />
                  {issue.email}
                </a>
              </div>
              {issue.phone && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Phone</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <a href={`tel:${cleanPhone}`} className="font-semibold text-slate-800 hover:underline flex items-center gap-1">
                      <PhoneIcon className="w-3.5 h-3.5 text-blue-600" />
                      {issue.phone}
                    </a>
                    <button
                      onClick={handleWhatsAppCustomer}
                      className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold inline-flex items-center gap-1"
                    >
                      <ChatBubbleLeftRightIcon className="w-3 h-3" />
                      WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Inquiry Category</span>
                <span className="font-bold text-slate-800 capitalize flex items-center gap-1">
                  <TagIcon className="w-3.5 h-3.5 text-slate-500" />
                  {issue.category.replace(/_/g, " ")}
                </span>
              </div>

              {issue.orderNumber && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Related Order Number</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-slate-900">#{issue.orderNumber}</span>
                    {onOpenOrder && (
                      <button
                        onClick={() => onOpenOrder(issue.orderNumber!)}
                        className="px-2.5 py-1 rounded bg-slate-900 text-white font-bold text-[10px] hover:bg-slate-800 inline-flex items-center gap-1"
                      >
                        <span>Inspect Order</span>
                        <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <span className="text-slate-400 block text-[11px]">Submitted At</span>
                <span className="text-slate-600">
                  {issue.createdAt ? format(new Date(issue.createdAt), "dd MMM yyyy, hh:mm a") : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Subject & Message Content */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-black text-slate-900 text-sm">{issue.subject}</h4>
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-normal">
              {issue.message}
            </div>
          </div>

          {/* Staff Resolution Notes Thread */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Internal Support Logs ({issue.notes?.length || 0})
            </h4>

            {issue.notes && issue.notes.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {issue.notes.map((note: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <p className="text-slate-800 font-medium">{note.text}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Added by {note.author} • {note.createdAt ? format(new Date(note.createdAt), "dd MMM, hh:mm a") : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add internal resolution note or action taken..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-brand"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || addNoteMutation.isPending}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                {addNoteMutation.isPending ? "Adding..." : "Add Note"}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {issue.phone && (
              <button
                onClick={handleWhatsAppCustomer}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                <span>WhatsApp Customer</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
