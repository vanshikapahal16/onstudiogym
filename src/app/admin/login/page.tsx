"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lock, User, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid credentials");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[150px] pointer-events-none" />
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
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 neon-glow">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight text-center">
              Admin <span className="text-primary">Portal</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-2 text-center">
              Secure access for authorized personnel only.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-4 text-sm font-semibold text-center backdrop-blur-md"
              >
                {error}
              </motion.div>
            )}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                <User className="w-4 h-4" /> Email or Phone Number
              </label>
              <input 
                type="text" 
                required 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-primary transition-colors" 
                placeholder="Email or phone number" 
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Password
                </label>
                <Link href="/admin/forgot-password" className="text-xs text-primary hover:text-blue-400 transition-colors">Forgot?</Link>
              </div>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-primary transition-colors" 
                placeholder="••••••••" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-primary text-white font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isSubmitting ? "Authenticating..." : "Login to Dashboard"}
              {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-white transition-colors">
              &larr; Back to Public Site
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
