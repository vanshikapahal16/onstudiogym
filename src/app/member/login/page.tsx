"use client";

import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Lock, UserCircle, Phone, User, Mail, CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function MemberAuthForm() {
  const [view, setView] = useState<"login" | "signup" | "success">("login");
  
  // Login State
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  
  // Signup State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/member";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/member/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId: identifier, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid credentials");
      }

      router.push(redirect);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/member/signup-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phoneNumber: phone, email }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Signup failed");
      }

      setView("success");
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
        <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-600/20 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-800/20 blur-[150px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-luminosity pointer-events-none" />
      </div>

      <motion.div 
        key={view}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(239,68,68,0.1)] backdrop-blur-2xl bg-[#0B0F19]/80">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6 neon-glow shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              {view === "success" ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <UserCircle className="w-8 h-8 text-red-500" />}
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight text-center">
              Member <span className="text-red-500">Portal</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-2 text-center">
              {view === "login" && "Welcome back. Let's crush your goals today."}
              {view === "signup" && "Request access to join our premium community."}
              {view === "success" && "Request Sent Successfully!"}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-4 text-sm font-semibold text-center backdrop-blur-md"
            >
              {error}
            </motion.div>
          )}

          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Email or Phone Number
                </label>
                <input 
                  type="text" 
                  required 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-red-500 transition-colors" 
                  placeholder="Email or Phone Number" 
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Password / Passkey
                  </label>
                  <Link href="/member/forgot-password" className="text-xs text-red-500 hover:text-red-400 transition-colors">Forgot?</Link>
                </div>
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-red-500 transition-colors" 
                  placeholder="••••••••" 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? "Signing In..." : "Enter Portal"}
                {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          )}

          {view === "signup" && (
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" /> Full Name
                </label>
                <input 
                  type="text" 
                  required 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" 
                  placeholder="John Doe" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone Number
                </label>
                <input 
                  type="tel" 
                  required 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" 
                  placeholder="8400050073" 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" 
                  placeholder="john@example.com" 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 mt-2 rounded-xl bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? "Submitting..." : "Request Access"}
                {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          )}

          {view === "success" && (
            <div className="text-center space-y-4">
              <p className="text-white text-lg">Your sign-up request has been successfully submitted to the admin.</p>
              <p className="text-gray-400 text-sm">Please wait for approval. You will receive an email and a 4-digit passkey to log in.</p>
              <button 
                onClick={() => setView("login")}
                className="mt-6 w-full py-4 rounded-xl bg-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {view !== "success" && (
            <div className="mt-6 pt-6 border-t border-white/10 text-center flex flex-col gap-3">
              {view === "login" ? (
                <p className="text-sm text-gray-400">
                  Not a member yet?{" "}
                  <button onClick={() => setView("signup")} className="text-red-500 hover:text-red-400 font-bold transition-colors">
                    Request Access
                  </button>
                </p>
              ) : (
                <p className="text-sm text-gray-400">
                  Already have an account?{" "}
                  <button onClick={() => setView("login")} className="text-red-500 hover:text-red-400 font-bold transition-colors">
                    Sign In
                  </button>
                </p>
              )}
              
              <Link href="/" className="text-xs text-muted-foreground hover:text-white transition-colors">
                &larr; Back to Public Site
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function MemberAuth() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white text-lg font-bold">
        Loading...
      </div>
    }>
      <MemberAuthForm />
    </Suspense>
  );
}
