"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createContactIssueSchema, CreateContactIssueInput } from "@store4riders/shared-validation";
import { useSubmitContactIssue } from "@/core/hooks/useContactIssues";
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ClipboardDocumentIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import Link from "next/link";

export function ContactPageModule() {
  const [submittedTicket, setSubmittedTicket] = useState<{ ticketId: string; email: string } | null>(null);
  const submitMutation = useSubmitContactIssue();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateContactIssueInput>({
    resolver: zodResolver(createContactIssueSchema),
    defaultValues: {
      category: "order_issue",
      name: "",
      email: "",
      phone: "",
      orderNumber: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: CreateContactIssueInput) => {
    try {
      const res = await submitMutation.mutateAsync(data);
      if (res?.data?.ticketId) {
        setSubmittedTicket({
          ticketId: res.data.ticketId,
          email: data.email,
        });
        reset();
      }
    } catch {
      // Error handled in hook onError
    }
  };

  const handleCopyTicket = (ticketId: string) => {
    navigator.clipboard.writeText(ticketId);
    toast.success("Ticket ID copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pt-28 sm:pt-32 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Hero */}
        <div className="bg-white rounded-3xl p-6 sm:p-12 shadow-xs border border-slate-200/80 text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-bold tracking-wide uppercase mb-4">
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span>Store4Riders Support</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-3">
            How Can We Assist You Today?
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Have a question regarding your order delivery, helmet sizing, payments, or exchanges?
            Our dedicated Customer Care team is here to assist every rider.
          </p>
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Direct Contact Info & Guarantees */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Contact Information Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
              <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                Direct Helpdesk Channels
              </h3>

              <div className="space-y-4 text-xs sm:text-sm">
                {/* Phone */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="p-2.5 rounded-lg bg-white shadow-2xs text-brand shrink-0">
                    <PhoneIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">Call Support</span>
                    <a href="tel:07795688316" className="text-brand font-semibold hover:underline block mt-0.5">
                      07795688316
                    </a>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Mon - Fri: 11:00 AM to 4:30 PM IST</span>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="p-2.5 rounded-lg bg-white shadow-2xs text-brand shrink-0">
                    <EnvelopeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">Email Helpdesk</span>
                    <a href="mailto:support@store4riders.com" className="text-brand font-semibold hover:underline block mt-0.5">
                      support@store4riders.com
                    </a>
                    <span className="text-[11px] text-slate-500 block mt-0.5">24/7 ticket logging &amp; assistance</span>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <div className="p-2.5 rounded-lg bg-white shadow-2xs text-emerald-600 shrink-0">
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-950 block text-sm">Official WhatsApp Support</span>
                    <a
                      href="https://wa.me/917795688316?text=Hi%20Store4Riders%20Support%2C%20I%20need%20assistance%20with%20an%20inquiry."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-bold hover:underline block mt-0.5 text-xs"
                    >
                      Chat with Support Specialist &rarr;
                    </a>
                    <span className="text-[11px] text-emerald-800/80 block mt-0.5">Fastest response for urgent delivery queries</span>
                  </div>
                </div>

                {/* Warehouse Location */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="p-2.5 rounded-lg bg-white shadow-2xs text-slate-600 shrink-0">
                    <MapPinIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">Store &amp; Fulfillment Warehouse</span>
                    <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                      Store4Riders Logistics Hub, Pune, Maharashtra, 411001, India
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Policy Links */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 space-y-3 text-xs">
              <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px]">Helpful Resources</span>
              <ul className="space-y-2 text-slate-600">
                <li>
                  <Link href="/returns" className="text-slate-800 hover:text-brand font-semibold flex items-center justify-between">
                    <span>7-Day Size &amp; Gear Exchange Policy</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="text-slate-800 hover:text-brand font-semibold flex items-center justify-between">
                    <span>Shipping Timelines &amp; Courier Coverage</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
                <li>
                  <Link href="/account/orders" className="text-slate-800 hover:text-brand font-semibold flex items-center justify-between">
                    <span>Check Order Status in My Account</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Contact Form or Success Confirmation */}
          <div className="lg:col-span-7">
            {submittedTicket ? (
              /* Success Confirmation Card */
              <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xs border border-slate-200/80 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircleIcon className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">Issue Logged Successfully!</h3>
                  <p className="text-slate-600 text-sm max-w-md mx-auto">
                    Your request has been routed directly to our Customer Care team. A confirmation has been logged for:
                  </p>
                  <p className="font-semibold text-slate-900 text-sm">{submittedTicket.email}</p>
                </div>

                {/* Ticket ID Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-sm mx-auto flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Support Reference ID</span>
                    <span className="font-mono font-black text-slate-900 text-base">{submittedTicket.ticketId}</span>
                  </div>
                  <button
                    onClick={() => handleCopyTicket(submittedTicket.ticketId)}
                    className="p-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-brand hover:border-brand text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                </div>

                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Our Customer Care representative will review your message and get in touch with you via email or phone within 24 business hours.
                </p>

                <div className="pt-2">
                  <button
                    onClick={() => setSubmittedTicket(null)}
                    className="px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              /* Contact Us Interactive Form */
              <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xs border border-slate-200/80 space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Raise an Issue / Contact Us
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Fill out the form below. Your ticket will be immediately routed to our Customer Care dashboard.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  
                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Issue Category <span className="text-brand">*</span>
                    </label>
                    <select
                      {...register("category")}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-brand font-medium"
                    >
                      <option value="order_issue">Order Status &amp; Tracking Assistance</option>
                      <option value="payment_issue">Payment or Online Checkout Issue</option>
                      <option value="return_exchange">Size &amp; Gear Exchange Request</option>
                      <option value="product_sizing">Product Specifications / Sizing Fitment</option>
                      <option value="shipping_delay">Courier Dispatch or Delivery Delay</option>
                      <option value="other">Other General Inquiry</option>
                    </select>
                    {errors.category && (
                      <p className="text-xs text-rose-600 mt-1">{errors.category.message}</p>
                    )}
                  </div>

                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Your Full Name <span className="text-brand">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Vikram Sharma"
                        {...register("name")}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-brand"
                      />
                      {errors.name && (
                        <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Email Address <span className="text-brand">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. rider@example.com"
                        {...register("email")}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-brand"
                      />
                      {errors.email && (
                        <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Phone & Order Number Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Phone Number <span className="text-slate-400 font-normal">(Recommended)</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        {...register("phone")}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-brand"
                      />
                      {errors.phone && (
                        <p className="text-xs text-rose-600 mt-1">{errors.phone.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Order Number <span className="text-slate-400 font-normal">(If applicable)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. #10023 or 20261024-..."
                        {...register("orderNumber")}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-brand"
                      />
                      {errors.orderNumber && (
                        <p className="text-xs text-rose-600 mt-1">{errors.orderNumber.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Subject / Short Summary <span className="text-brand">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Need to change delivery address or check size chart for Axor helmet"
                      {...register("subject")}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-brand"
                    />
                    {errors.subject && (
                      <p className="text-xs text-rose-600 mt-1">{errors.subject.message}</p>
                    )}
                  </div>

                  {/* Detailed Message */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Detailed Description <span className="text-brand">*</span>
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Please describe your issue or inquiry in detail so our support team can assist you as quickly as possible..."
                      {...register("message")}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-brand"
                    />
                    {errors.message && (
                      <p className="text-xs text-rose-600 mt-1">{errors.message.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || submitMutation.isPending}
                      className="w-full py-3.5 px-6 rounded-xl bg-brand hover:bg-brand/90 text-white font-bold text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {submitMutation.isPending ? "Submitting Inquiry..." : "Submit Support Request"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
