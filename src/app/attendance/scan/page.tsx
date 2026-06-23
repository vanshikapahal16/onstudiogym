"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, AlertCircle, Dumbbell, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface MarkResult {
  success: boolean;
  message: string;
  data?: {
    attendance?: {
      name: string;
      email: string;
      date: string;
      time: string;
      status: string;
    };
  };
}

export default function AttendanceScanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<MarkResult | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const markAttendance = async () => {
      try {
        const response = await fetch("/api/attendance/mark", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401) {
          // Redirect to login page if unauthenticated, returning to this page after
          router.push(`/member/login?redirect=/attendance/scan`);
          return;
        }

        const data: MarkResult = await response.json();
        setResult(data);
        
        if (!response.ok) {
          if (response.status === 400 && data.message?.toLowerCase().includes("already marked")) {
            setIsDuplicate(true);
          } else {
            setErrorMessage(data.message || "Unable to mark attendance. Please contact support.");
          }
        }
      } catch (error) {
        console.error("Attendance marking failed:", error);
        setErrorMessage("Network error. Please make sure you are connected to the gym Wi-Fi/Internet.");
      } finally {
        setLoading(false);
      }
    };

    markAttendance();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[60%] h-[60%] rounded-full bg-[#00FFB2]/10 blur-[180px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[60%] h-[60%] rounded-full bg-[#3B82F6]/10 blur-[180px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#0B0F19]/80 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,255,178,0.05)] text-center">
          
          {/* Gym Header */}
          <div className="flex items-center gap-2.5 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#00FFB2]/10 border border-[#00FFB2]/30 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-[#00FFB2]" />
            </div>
            <span className="text-lg font-black tracking-widest uppercase text-white">
              ON <span className="text-[#00FFB2]">FITNESS STUDIO</span>
            </span>
          </div>

          {loading && (
            <div className="py-12 flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-[#00FFB2] animate-spin" />
              <p className="text-slate-400 font-medium tracking-wide">
                Verifying session and marking attendance...
              </p>
            </div>
          )}

          {!loading && (
            <div>
              {/* Success Check-in */}
              {result?.success && result.data?.attendance && (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="space-y-6"
                >
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-[#00FFB2]/10 border border-[#00FFB2]/30 flex items-center justify-center shadow-[0_0_40px_rgba(0,255,178,0.15)]">
                      <CheckCircle2 className="w-10 h-10 text-[#00FFB2]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                      Attendance Marked Successfully ✅
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Welcome back! Have an amazing workout session today.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-left space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-medium">Member</span>
                      <span className="text-white font-bold">{result.data.attendance.name}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-white/5 pt-2">
                      <span className="text-slate-400 font-medium">Email</span>
                      <span className="text-white font-bold">{result.data.attendance.email}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-white/5 pt-2">
                      <span className="text-slate-400 font-medium">Date</span>
                      <span className="text-white font-bold">{result.data.attendance.date}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-white/5 pt-2">
                      <span className="text-slate-400 font-medium">Checked In</span>
                      <span className="text-white font-bold">{result.data.attendance.time}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Already Marked Today */}
              {isDuplicate && (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="space-y-6"
                >
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.15)]">
                      <AlertTriangle className="w-10 h-10 text-[#3B82F6]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-[#3B82F6]">
                      Attendance Already Marked Today
                    </h2>
                    <p className="text-slate-400 text-sm">
                      You have already scanned in for today. No need to register again.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-left text-sm text-center text-slate-300">
                    Your attendance is already recorded on our system. Continue into the gym floor and enjoy your training!
                  </div>
                </motion.div>
              )}

              {/* Errors (Suspended, Expired, Or General) */}
              {!result?.success && !isDuplicate && (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="space-y-6"
                >
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.15)]">
                      <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-red-500">
                      Attendance Failed
                    </h2>
                    <p className="text-slate-400 text-sm">
                      We encountered an issue checking you in.
                    </p>
                  </div>

                  <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 text-center text-sm text-red-400 font-medium">
                    {errorMessage}
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-3">
                <Link
                  href="/member"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00FFB2] to-[#3B82F6] text-black font-bold uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer shadow-[0_0_25px_rgba(0,255,178,0.15)]"
                >
                  Go to Member Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
