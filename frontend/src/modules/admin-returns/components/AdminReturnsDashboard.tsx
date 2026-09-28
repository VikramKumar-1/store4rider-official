"use client";

import React, { useState } from "react";
import { useAdminReturns, useInwardScanQC, useProcessQC } from "@/core/hooks/useReturn";
import { IReturn } from "@store4riders/shared-types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { qcInwardSchema } from "@store4riders/shared-validation";

export const AdminReturnsDashboard = () => {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data, isLoading } = useAdminReturns(1, 50, statusFilter);
  const { mutate: scanInward } = useInwardScanQC();
  
  const [selectedReturn, setSelectedReturn] = useState<IReturn | null>(null);

  const handleScan = (id: string) => {
    if (confirm("Confirm inward scan? 48-hour SLA will start immediately.")) {
      scanInward(id, {
        onSuccess: () => alert("Inward successful!"),
        onError: (err: any) => alert(err?.response?.data?.message || "Scan failed")
      });
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Returns & QC Dashboard</h1>
        
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">All Statuses</option>
          <option value="reached_facility">Reached Facility (Needs Scan)</option>
          <option value="inwarded_for_qc">Inwarded (Pending QC)</option>
          <option value="refunded">Refunded</option>
          <option value="qc_failed">QC Failed / Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <p>Loading returns...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="uppercase tracking-wider border-b-2">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Expected Refund</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((ret: IReturn) => (
                <tr key={ret._id || ret.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{ret.orderId}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      ret.status === "inwarded_for_qc" ? "bg-yellow-100 text-yellow-800" :
                      ret.status === "reached_facility" ? "bg-blue-100 text-blue-800" :
                      ret.status === "refunded" ? "bg-green-100 text-green-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {ret.status}
                    </span>
                    {ret.courierDispute && (
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Dispute</span>
                    )}
                  </td>
                  <td className="px-4 py-3 uppercase">{ret.refundMethod}</td>
                  <td className="px-4 py-3">₹{ret.refundAmount}</td>
                  <td className="px-4 py-3 space-x-2">
                    {ret.status === "reached_facility" && (
                      <button 
                        onClick={() => handleScan(ret._id || ret.id as string)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Inward Scan
                      </button>
                    )}
                    {ret.status === "inwarded_for_qc" && (
                      <button 
                        onClick={() => setSelectedReturn(ret)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                      >
                        Process QC
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedReturn && (
        <ProcessQCModal 
          returnDoc={selectedReturn} 
          onClose={() => setSelectedReturn(null)} 
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// QC Action Modal Component
// ---------------------------------------------------------------------------
const ProcessQCModal = ({ returnDoc, onClose }: { returnDoc: IReturn, onClose: () => void }) => {
  const { mutate: processQc, isPending } = useProcessQC();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(qcInwardSchema),
    defaultValues: {
      action: "approve_full",
      customRefundAmount: returnDoc.refundAmount, // Default to full amount
      qcNotes: ""
    }
  });

  const action = watch("action");

  const onSubmit = (data: any) => {
    processQc({
      returnId: returnDoc._id || returnDoc.id as string,
      ...data
    }, {
      onSuccess: () => {
        alert("QC Processed! Refund triggered if applicable.");
        onClose();
      },
      onError: (err: any) => alert(err?.response?.data?.message || "Failed to process QC")
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <h2 className="text-xl font-bold mb-4">Process QC: {returnDoc.orderId}</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block font-medium mb-2">QC Action</label>
            <select {...register("action")} className="w-full border p-2 rounded">
              <option value="approve_full">🟢 Approve Full Refund (₹{returnDoc.refundAmount})</option>
              <option value="approve_partial">🟡 Approve Partial Refund (Custom Amount)</option>
              <option value="reject">🔴 Reject (Customer Fraud / Fake)</option>
              <option value="courier_dispute">📦 Courier Damaged (Claim Dispute)</option>
            </select>
          </div>

          {action === "approve_partial" && (
            <div>
              <label className="block text-sm font-medium mb-1">Enter Exact Amount to Refund (₹) *</label>
              <input 
                type="number" 
                {...register("customRefundAmount", { valueAsNumber: true })}
                className="w-full border p-2 rounded" 
                placeholder={`Max: ₹${returnDoc.refundAmount}`}
              />
              {errors.customRefundAmount && <p className="text-red-500 text-xs mt-1">{errors.customRefundAmount.message}</p>}
            </div>
          )}

          {(action === "reject" || action === "approve_partial" || action === "courier_dispute") && (
            <div>
              <label className="block text-sm font-medium mb-1">QC Notes / Reason *</label>
              <textarea 
                {...register("qcNotes")}
                className="w-full border p-2 rounded"
                rows={3}
                placeholder="Write reason for deduction, rejection, or damage description..."
              />
              {errors.qcNotes && <p className="text-red-500 text-xs mt-1">{errors.qcNotes.message}</p>}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-black text-white rounded">
              {isPending ? "Processing..." : "Confirm & Execute"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
