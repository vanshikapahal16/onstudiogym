"use client";

import { SignOutButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Clock, ShieldAlert, LogOut } from "lucide-react";
import Link from "next/link";

export default function WaitingApprovalPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Futuristic Background Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#3B82F6]/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-5 mix-blend-luminosity pointer-events-none" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-8 md:p-10 rounded-3xl backdrop-blur-2xl bg-[#0B0F19]/80 border border-white/10 text-center shadow-[0_0_50px_rgba(234,179,8,0.15)]">
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(234,179,8,0.2)] animate-pulse">
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>

          <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4">
            Waiting for <span className="text-yellow-500">Approval</span>
          </h2>
          
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            Your registration request has been successfully submitted to the admin portal. Once an administrator approves your membership, you will gain full access to your member dashboard.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 text-left text-xs text-gray-300 space-y-2">
            <div className="font-bold text-yellow-500 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> What happens now?
            </div>
            <div className="flex gap-2 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1 shrink-0" />
              <span>Admin reviews your profile name and email.</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1 shrink-0" />
              <span>Admin activates your membership parameters.</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1 shrink-0" />
              <span>You will immediately gain dashboard access.</span>
            </div>
          </div>

          <div className="space-y-4">
            <SignOutButton>
              <button
                className="w-full py-4 rounded-xl bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 group text-sm cursor-pointer font-sans"
              >
                <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-1" />
                Sign Out / Change Account
              </button>
            </SignOutButton>

            <Link
              href="/"
              className="block text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
