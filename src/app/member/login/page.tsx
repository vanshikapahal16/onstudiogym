"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lock, UserCircle, Phone, User, Mail, MapPin, CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function MemberLoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Login states
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  // Sign up states
  const [signUpName, setSignUpName] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpAddress, setSignUpAddress] = useState("");

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
        body: JSON.stringify({ loginId, password }),
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/member/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signUpName,
          phone: signUpPhone,
          email: signUpEmail,
          address: signUpAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit request");
      }

      setIsSubmitted(true);
      setError("");
      // Clear fields
      setSignUpName("");
      setSignUpPhone("");
      setSignUpEmail("");
      setSignUpAddress("");
    } catch (err: any) {
      setError(err.message || "Failed to submit signup request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#00FFB2]/10 blur-[150px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#3B82F6]/10 blur-[150px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="glass-panel p-8 md:p-10 rounded-3xl backdrop-blur-2xl bg-[#0B0F19]/80 text-center shadow-[0_0_50px_rgba(0,255,178,0.15)]">
            <div className="w-20 h-20 rounded-full bg-[#00FFB2]/10 border border-[#00FFB2]/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,255,178,0.2)]">
              <CheckCircle2 className="w-10 h-10 text-[#00FFB2]" />
            </div>

            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4">
              Request <span className="text-[#00FFB2]">Submitted</span>
            </h2>
            
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              Your registration request has been successfully sent to the admin portal. Once approved, the admin will set up your membership, and you will receive your 4-digit passcode.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 text-left text-xs text-gray-300 space-y-2">
              <div className="font-bold text-[#00FFB2] uppercase tracking-wider text-[10px]">What's Next?</div>
              <div className="flex gap-2 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FFB2] mt-1 shrink-0" />
                <span>Admin reviews your application.</span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FFB2] mt-1 shrink-0" />
                <span>Admin generates your secure 4-digit passcode.</span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FFB2] mt-1 shrink-0" />
                <span>Log in here using your registered email and passcode.</span>
              </div>
            </div>

            <button
              onClick={() => setIsSubmitted(false)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00FFB2] to-[#3B82F6] text-black font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_25px_rgba(0,255,178,0.3)] hover:shadow-[0_0_35px_rgba(0,255,178,0.5)] flex items-center justify-center gap-2 group text-sm"
            >
              Back to Login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#00FFB2]/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#3B82F6]/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-5 mix-blend-luminosity" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-8 md:p-10 rounded-3xl backdrop-blur-2xl bg-[#0B0F19]/80 border border-white/10 shadow-[0_0_50px_rgba(0,255,178,0.05)]">
          {/* Logo / Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#00FFB2]/10 border border-[#00FFB2]/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,255,178,0.2)]">
              <UserCircle className="w-8 h-8 text-[#00FFB2]" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight text-center">
              Member <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFB2] to-[#3B82F6]">Portal</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-2 text-center">
              {isSignUp ? "Request access to join our gym community" : "Enter your credentials to access your portal"}
            </p>
          </div>

          {/* Sliding Tab Toggle */}
          <div className="grid grid-cols-2 bg-white/5 p-1 rounded-xl border border-white/10 mb-8 relative">
            <button
              onClick={() => {
                setIsSignUp(false);
                setError("");
              }}
              className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all relative z-10 ${
                !isSignUp ? "text-[#0B0F19]" : "text-gray-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setError("");
              }}
              className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all relative z-10 ${
                isSignUp ? "text-[#0B0F19]" : "text-gray-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>

            {/* Slider Accent */}
            <motion.div
              className="absolute top-1 bottom-1 left-1 rounded-lg bg-gradient-to-r from-[#00FFB2] to-[#3B82F6]"
              layout
              style={{
                width: "calc(50% - 4px)",
                transform: isSignUp ? "translateX(100%)" : "translateX(0)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Form */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-xs font-semibold text-center mb-6 backdrop-blur-md"
            >
              {error}
            </motion.div>
          )}

          {!isSignUp ? (
            /* SIGN IN FORM */
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#00FFB2]" /> Email or Phone Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-4 py-4 text-white focus:outline-none focus:border-[#00FFB2] focus:ring-1 focus:ring-[#00FFB2] transition-all text-sm"
                    placeholder="Enter email or phone"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-[#00FFB2]" /> Password / Passcode
                  </label>
                  <Link
                    href="/member/forgot-password"
                    className="text-[10px] font-bold text-[#00FFB2] hover:text-[#3B82F6] uppercase tracking-wider transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#00FFB2] focus:ring-1 focus:ring-[#00FFB2] transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-[#00FFB2] text-black font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,255,178,0.25)] hover:shadow-[0_0_30px_rgba(0,255,178,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group text-sm"
              >
                {isSubmitting ? "Signing In..." : "Enter Portal"}
                {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#00FFB2]" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all text-sm"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#00FFB2]" /> Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all text-sm"
                  placeholder="9876543210"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#00FFB2]" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all text-sm"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#00FFB2]" /> Residential Address
                </label>
                <textarea
                  required
                  rows={2}
                  value={signUpAddress}
                  onChange={(e) => setSignUpAddress(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all text-sm resize-none"
                  placeholder="Enter full address"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-[#00FFB2] to-[#3B82F6] text-black font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group text-sm"
              >
                {isSubmitting ? "Submitting Request..." : "Request Membership"}
                {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          )}

          {/* Footer Back Link */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors">
              &larr; Back to Public Site
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function MemberLogin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white text-lg font-bold">
        Loading...
      </div>
    }>
      <MemberLoginForm />
    </Suspense>
  );
}
