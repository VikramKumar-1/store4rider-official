import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Store4Riders",
  description: "Read our terms of service, acceptable use guidelines, and purchasing terms for Store4Riders.",
};

export default function TermsPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50 text-slate-900 pt-32 pb-16 px-6">
      <div className="max-w-3xl w-full bg-white rounded-3xl p-12 shadow-sm border border-slate-200/80 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-6">
          <span className="font-black text-2xl">T</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-4">Terms of Service</h1>
        <p className="text-slate-500 font-medium mb-8 text-lg">
          This is a simulated placeholder page for the portfolio presentation. 
          In a production environment, this would contain the fully functional Terms of Service flow.
        </p>
        <Link href="/" className="inline-block bg-slate-900 text-white font-bold px-8 py-4 rounded-full hover:bg-slate-800 hover:scale-105 transition-all">Return Home</Link>
      </div>
    </div>
  );
}

