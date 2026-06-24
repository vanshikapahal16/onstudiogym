"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, AlertTriangle, User, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [uniqueId, setUniqueId] = useState("");
  const [passkey, setPasskey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized") {
      setError("Access Denied: Please log in with an authorized administrator account.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniqueId.trim() || !passkey) {
      setError("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unique_id: uniqueId.trim(),
          passkey: passkey,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid Unique ID or Passkey");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Authentication failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#3B82F6]/20 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#00FFB2]/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-luminosity pointer-events-none" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.1)] backdrop-blur-2xl bg-[#0B0F19]/80">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center mb-6 neon-glow">
              <ShieldCheck className="w-8 h-8 text-[#3B82F6]" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight text-center">
              Admin <span className="text-[#3B82F6]">Portal</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-2 text-center">
              Authorized personnel only. Secure credentials login.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-xs font-semibold text-center mb-6 backdrop-blur-md flex items-start gap-2 text-left"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Credentials Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                Unique ID
              </label>
              <div className="relative group">
                <User className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#3B82F6] transition-colors" />
                <input
                  type="text"
                  required
                  value={uniqueId}
                  onChange={(e) => setUniqueId(e.target.value)}
                  placeholder="Enter Unique ID"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/50 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                Passkey
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#3B82F6] transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Enter passkey"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/50 transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-4 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] hover:from-[#2563EB] hover:to-[#1E40AF] text-white font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(59,130,246,0.25)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group text-sm cursor-pointer font-sans"
            >
              {isSubmitting ? "Authenticating..." : "Login to Portal"}
              {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 text-center flex flex-col gap-4">
            <Link href="/" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors">
              &larr; Back to Public Site
            </Link>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5 mt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3B82F6]" /> Secure JWT Session Connection
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 text-white text-sm font-sans uppercase tracking-widest">
        Loading Admin Portal...
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}
