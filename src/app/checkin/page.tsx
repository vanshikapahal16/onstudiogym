"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Dumbbell, CheckCircle2, XCircle, Loader2, ArrowRight, Home } from "lucide-react";
import Link from "next/link";

export default function CheckinPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "submitting" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");
  const [memberData, setMemberData] = useState<{ fullName: string; attendanceCount: number } | null>(null);

  useEffect(() => {
    const runCheckin = async () => {
      try {
        // 1. Verify if user is logged in
        const profileRes = await fetch("/api/member/profile");
        if (profileRes.status === 401) {
          // Redirect to login with redirect parameter back to /checkin
          router.push("/member/login?redirect=/checkin");
          return;
        }

        if (!profileRes.ok) {
          setStatus("error");
          setMessage("Failed to verify user profile session. Please try logging in again.");
          return;
        }

        const profileData = await profileRes.json();
        if (!profileData.success) {
          setStatus("error");
          setMessage(profileData.message || "Failed to load session details.");
          return;
        }

        // 2. User is logged in, submit check-in request
        setStatus("submitting");
        const checkinRes = await fetch("/api/attendance/checkin-common", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const checkinData = await checkinRes.json();
        if (checkinRes.ok && checkinData.success) {
          setStatus("success");
          setMessage(checkinData.message || "Successfully checked in!");
          setMemberData(checkinData.data.member);
        } else {
          setStatus("error");
          setMessage(checkinData.message || "Failed to register attendance.");
        }
      } catch (error) {
        console.error("Check-in routine failed:", error);
        setStatus("error");
        setMessage("A connection issue occurred. Please check your internet connection.");
      }
    };

    runCheckin();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[20%] left-[-15%] w-[60%] h-[60%] rounded-full bg-[#c39b62]/10 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[60%] rounded-full bg-[#c39b62]/5 blur-[150px] pointer-events-none" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(195,155,98,0.1)] backdrop-blur-2xl bg-[#0B0F19]/80 text-center">
          
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#c39b62]/10 border border-[#c39b62]/30 flex items-center justify-center neon-glow">
              <Dumbbell className="w-8 h-8 text-[#c39b62] animate-pulse" />
            </div>
          </div>

          <span className="text-sm font-bold tracking-widest text-slate-500 uppercase block mb-2">
            ON FITNESS STUDIO
          </span>

          {status === "verifying" && (
            <div className="space-y-4 py-8">
              <div className="flex justify-center">
                <Loader2 className="w-12 h-12 text-[#c39b62] animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-wide">
                Verifying Session
              </h2>
              <p className="text-slate-400 text-sm">
                Checking your gym member account credentials...
              </p>
            </div>
          )}

          {status === "submitting" && (
            <div className="space-y-4 py-8">
              <div className="flex justify-center">
                <Loader2 className="w-12 h-12 text-[#c39b62] animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-wide">
                Recording Visit
              </h2>
              <p className="text-slate-400 text-sm">
                Logging your entrance to the attendance database...
              </p>
            </div>
          )}

          {status === "success" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 py-4"
            >
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  Welcome, {memberData?.fullName}!
                </h2>
                <p className="text-green-500 font-semibold text-sm mt-1">
                  Attendance Marked Successfully
                </p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-xs text-slate-400 uppercase tracking-widest">Total Visits Logged</p>
                <p className="text-3xl font-black text-white mt-1">{memberData?.attendanceCount}</p>
              </div>

              <p className="text-slate-400 text-sm italic">
                "No shortcuts. Work hard, stay consistent, and crush your goals."
              </p>

              <div className="pt-4 flex flex-col gap-3">
                <Link 
                  href="/member" 
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#c39b62] to-[#b8956c] text-black font-bold uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(195,155,98,0.3)]"
                >
                  Member Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 py-4"
            >
              <div className="flex justify-center">
                <XCircle className="w-16 h-16 text-[#c39b62] animate-bounce" />
              </div>
              
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  Check-In Failed
                </h2>
                <p className="text-[#c39b62] font-semibold text-sm mt-1">
                  Access Denied
                </p>
              </div>

              <div className="p-4 bg-[#c39b62]/10 border border-[#c39b62]/20 text-gray-300 text-sm rounded-2xl leading-relaxed">
                {message}
              </div>

              <p className="text-slate-400 text-xs">
                Please verify that your subscription is active, you are not already checked in today, and try scanning again.
              </p>

              <div className="pt-4 flex flex-col gap-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#c39b62] to-[#b8956c] text-black font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(195,155,98,0.3)] cursor-pointer"
                >
                  Try Again
                </button>
                <Link 
                  href="/" 
                  className="w-full py-4 rounded-xl border border-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" /> Home Page
                </Link>
              </div>
            </motion.div>
          )}
          
        </div>
      </div>
    </div>
  );
}
