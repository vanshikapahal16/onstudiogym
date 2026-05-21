"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams.get("token") || "";
  const role = searchParams.get("role") || "member";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset request: token is missing. Please request a new link.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, role }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginLink = role === "admin" ? "/admin/login" : "/member/login";

  return (
    <div className="w-full max-w-md relative z-10">
      <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(239,68,68,0.1)] backdrop-blur-2xl bg-[#0B0F19]/80">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6 neon-glow shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight text-center">
            New <span className="text-red-500">Password</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2 text-center">
            Create a secure new password for your account.
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
            <h2 className="text-xl font-bold text-white">Password Updated!</h2>
            <p className="text-muted-foreground text-sm">
              Your password has been successfully updated. You can now use your new password to log in.
            </p>
            <div className="pt-4">
              <Link 
                href={loginLink} 
                className="w-full py-4 rounded-xl bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)] font-bold"
              >
                Go to Login <ArrowRight className="w-5 h-5" />
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
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                New Password
              </label>
              <input 
                type="password" 
                required 
                disabled={!token}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-red-500 transition-colors" 
                placeholder="••••••••" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                Confirm New Password
              </label>
              <input 
                type="password" 
                required 
                disabled={!token}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-red-500 transition-colors" 
                placeholder="••••••••" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || !token}
              className="w-full py-4 rounded-xl bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isSubmitting ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-600/20 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-800/20 blur-[150px] pointer-events-none" />
      </div>
      
      <Suspense fallback={
        <div className="text-white text-lg font-bold">Loading...</div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
