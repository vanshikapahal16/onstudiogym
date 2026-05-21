"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function AdminForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "admin" }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to request link");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[150px] pointer-events-none" />
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
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight text-center">
              Admin <span className="text-primary">Recovery</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-2 text-center">
              Enter your admin email to receive a recovery link.
            </p>
          </div>

          {success ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 text-center"
            >
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-white">Check Your Email</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                If the email <span className="text-white font-semibold">{email}</span> exists, we have generated and sent a password reset link to it.
              </p>
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-left">
                <p className="text-xs text-yellow-500 font-semibold mb-1">💡 Developer Note:</p>
                <p className="text-xs text-gray-400 leading-normal">
                  If SMTP is not configured in `.env.local`, the email reset URL has been printed to the **Server Terminal Console** instead. Check there to copy the link!
                </p>
              </div>
              <div className="pt-4">
                <Link 
                  href="/admin/login" 
                  className="w-full py-4 rounded-xl border border-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" /> Return to Login
                </Link>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Mail className="w-4 h-4" /> Admin Email
                </label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-primary transition-colors" 
                  placeholder="admin@example.com" 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-primary text-white font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
                {!isSubmitting && <Send className="w-4 h-4" />}
              </button>

              <div className="text-center pt-2">
                <Link href="/admin/login" className="text-sm text-muted-foreground hover:text-white transition-colors flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
