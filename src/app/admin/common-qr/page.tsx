"use client";

import { useEffect, useState } from "react";
import { Dumbbell, Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CommonQRPage() {
  const [checkinUrl, setCheckinUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCheckinUrl(`${window.location.origin}/checkin`);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const qrImageUrl = checkinUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(checkinUrl)}`
    : "";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 print:bg-white print:text-black">
      {/* Navigation - Hidden on Print */}
      <div className="w-full max-w-lg flex justify-between mb-8 print:hidden">
        <Link 
          href="/admin" 
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admin
        </Link>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-[#c39b62] hover:bg-[#b8956c] text-black rounded-lg text-sm font-bold uppercase tracking-wider transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print Poster
        </button>
      </div>

      {/* Poster Body */}
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-12 text-center shadow-2xl flex flex-col items-center print:border-none print:shadow-none print:bg-white print:p-0">
        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="w-12 h-12 rounded-lg bg-[#c39b62]/10 border border-[#c39b62]/30 flex items-center justify-center print:border-[#c39b62]">
            <Dumbbell className="w-6 h-6 text-[#c39b62]" />
          </div>
          <span className="text-2xl font-black tracking-widest uppercase">
            ON <span className="text-[#c39b62]">FITNESS STUDIO</span>
          </span>
        </div>

        <h1 className="text-3xl font-black tracking-tight uppercase mb-4 text-white print:text-black">
          MEMBER SELF CHECK-IN
        </h1>
        
        <p className="text-slate-400 text-sm max-w-xs mb-8 print:text-slate-700">
          Scan this code with your mobile phone camera to record your daily attendance.
        </p>

        {/* QR Code Container */}
        <div className="bg-white p-6 rounded-2xl border-4 border-[#c39b62] shadow-[0_0_50px_rgba(195,155,98,0.2)] mb-8 print:shadow-none print:border-slate-300">
          {checkinUrl ? (
            <img 
              src={qrImageUrl} 
              alt="Gym entrance check-in QR Code" 
              className="w-72 h-72"
            />
          ) : (
            <div className="w-72 h-72 flex items-center justify-center text-slate-800 font-bold">
              Generating Code...
            </div>
          )}
        </div>

        <div className="space-y-3 text-left w-full max-w-xs text-xs text-slate-400 print:text-slate-800">
          <p className="flex items-start gap-2">
            <span className="font-bold text-[#c39b62]">1.</span>
            <span>Open your phone's camera or a QR scanner app.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-bold text-[#c39b62]">2.</span>
            <span>Scan the QR code and tap the link that appears.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-bold text-[#c39b62]">3.</span>
            <span>Log in if prompted; your attendance will register immediately!</span>
          </p>
        </div>

        <div className="mt-8 border-t border-slate-800 w-full pt-6 text-slate-500 text-xxs tracking-widest uppercase print:border-slate-200 print:text-slate-600">
          Khubru Road, Near Shiv Garden, Ganaur
        </div>
      </div>
    </div>
  );
}
