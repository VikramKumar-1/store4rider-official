"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReturnSchema } from "@store4riders/shared-validation";
import { useCreateReturn } from "@/core/hooks/useReturn";
import { IOrder } from "@store4riders/shared-types";

// Assuming you have standard UI components. We'll use basic Tailwind here 
// to match the robust setup without breaking on missing custom UI components.

interface ReturnOrderModalProps {
  order: IOrder;
  onClose: () => void;
}

export const ReturnOrderModal: React.FC<ReturnOrderModalProps> = ({ order, onClose }) => {
  const { mutate: createReturn, isPending } = useCreateReturn();
  const [errorMsg, setErrorMsg] = useState("");

  const isCOD = order.paymentMethod === "cod";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createReturnSchema),
    defaultValues: {
      orderId: (order as any)._id || order.id,
      items: order.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        reason: "",
      })),
      refundMethod: isCOD ? "upi" : "original_source",
      upiId: "",
      bankDetails: {
        accountNumber: "",
        ifsc: "",
        accountHolderName: "",
      },
    },
  });

  const refundMethod = watch("refundMethod");

  const onSubmit = (data: any) => {
    setErrorMsg("");
    createReturn(data, {
      onSuccess: () => {
        alert("Return request submitted successfully!");
        onClose();
      },
      onError: (error: any) => {
        setErrorMsg(error?.response?.data?.message || "Failed to submit return request");
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black font-bold text-xl"
        >
          &times;
        </button>
        
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Request a Return</h2>
        
        {errorMsg && (
          <div className="bg-red-50 text-brand p-3 rounded mb-4 text-sm border border-brand/20">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* ITEMS TO RETURN */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 border-b pb-2">Select Items to Return</h3>
            {order.items.map((item, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded border">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Reason for Return *</label>
                  <textarea 
                    {...register(`items.${index}.reason` as const)}
                    className="w-full border rounded p-2 text-sm focus:ring-brand focus:border-brand"
                    rows={2}
                    placeholder="e.g., Size too small, damaged product..."
                  />
                  {errors.items?.[index]?.reason && (
                    <p className="text-brand text-xs mt-1">{errors.items[index]?.reason?.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* REFUND METHOD (Only dynamic if COD) */}
          <div className="bg-gray-50 p-4 rounded border space-y-4">
            <h3 className="font-semibold text-gray-700 border-b pb-2">Refund Details</h3>
            
            {!isCOD ? (
              <div className="text-sm text-gray-600">
                <p>You paid online via {order.paymentMethod.toUpperCase()}.</p>
                <p className="font-medium text-green-600 mt-1">Refund will automatically be credited to your original payment source.</p>
                {/* Hidden input to satisfy schema */}
                <input type="hidden" {...register("refundMethod")} value="original_source" />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-2">Since this was a Cash on Delivery order, please choose how you want your refund.</p>
                
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" {...register("refundMethod")} value="upi" className="text-brand focus:ring-brand" />
                    <span className="text-sm">UPI Transfer</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" {...register("refundMethod")} value="bank_transfer" className="text-brand focus:ring-brand" />
                    <span className="text-sm">Bank Transfer</span>
                  </label>
                </div>

                {/* UPI ID INPUT */}
                {refundMethod === "upi" && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Enter your UPI ID *</label>
                    <input 
                      type="text" 
                      {...register("upiId")}
                      placeholder="e.g., rahul@okhdfcbank"
                      className="w-full border rounded p-2 text-sm"
                    />
                    {errors.upiId && <p className="text-brand text-xs mt-1">{errors.upiId.message}</p>}
                  </div>
                )}

                {/* BANK DETAILS INPUT */}
                {refundMethod === "bank_transfer" && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Account Holder Name *</label>
                      <input type="text" {...register("bankDetails.accountHolderName")} className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Account Number *</label>
                      <input type="text" {...register("bankDetails.accountNumber")} className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">IFSC Code *</label>
                      <input type="text" {...register("bankDetails.ifsc")} className="w-full border rounded p-2 text-sm uppercase" />
                    </div>
                    {errors.bankDetails && <p className="text-brand text-xs mt-1 sm:col-span-2">Please fill all bank details correctly.</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isPending}
              className="px-6 py-2 bg-brand text-white rounded hover:bg-brand/90 transition-colors disabled:opacity-50"
            >
              {isPending ? "Submitting..." : "Submit Request"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
