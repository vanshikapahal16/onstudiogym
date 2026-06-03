"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { motion } from "framer-motion";
import { UserCircle, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function MemberLoginForm() {
  const { signIn } = useSignIn();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    if (!signIn) return;
    setIsSubmitting(true);
    setError("");

    try {
      await signIn.sso({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectCallbackUrl: "/sso-callback",
      });
    } catch (err: any) {
      console.error("OAuth error:", err);
      setError(err.message || "Google Authentication failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Futuristic Background Glows */}
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
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#00FFB2]/10 border border-[#00FFB2]/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,255,178,0.2)] animate-pulse">
              <UserCircle className="w-8 h-8 text-[#00FFB2]" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight text-center">
              Member <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFB2] to-[#3B82F6]">Portal</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-2 text-center">
              Securely access your plans, payments, and attendance.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-xs font-semibold text-center mb-6 backdrop-blur-md"
            >
              {error}
            </motion.div>
          )}

          {/* Social Sign-In ONLY */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-white text-black font-bold uppercase tracking-widest hover:bg-white/95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group text-sm cursor-pointer font-sans"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              {isSubmitting ? "Redirecting..." : "Continue with Google"}
              {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>

          {/* Footer Back Link */}
          <div className="mt-8 text-center flex flex-col gap-4">
            <Link href="/" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors">
              &larr; Back to Public Site
            </Link>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5 mt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00FFB2]" /> Powered by Clerk
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
