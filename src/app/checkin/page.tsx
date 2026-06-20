"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dumbbell, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowRight, 
  Home, 
  Mail, 
  Scan, 
  Camera, 
  RefreshCw,
  LogOut
} from "lucide-react";
import Link from "next/link";

export default function CheckinPage() {
  const router = useRouter();
  
  // Status states:
  // "verifying" - Checking if authenticated or has cached email
  // "email-prompt" - Not authenticated/cached, showing email form & scan selector
  // "submitting" - Processing API request
  // "success" - Successfully checked in
  // "error" - Check-in failed with error message
  const [status, setStatus] = useState<"verifying" | "email-prompt" | "submitting" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");
  const [memberData, setMemberData] = useState<{ fullName: string; attendanceCount: number; email?: string } | null>(null);
  
  // Checking in inputs
  const [activeTab, setActiveTab] = useState<"email" | "camera">("email");
  const [emailInput, setEmailInput] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const [html5QrcodeScanner, setHtml5QrcodeScanner] = useState<any>(null);

  // 1. Initial Load Verification Routine
  useEffect(() => {
    const runInitialVerify = async () => {
      try {
        // Step A: Check if member is logged in via profile API
        const profileRes = await fetch("/api/member/profile");
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.success && profileData.data?.member) {
            // Already logged in! Auto-submit check-in via authenticated session
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
              
              // Cache email if available
              if (checkinData.data.member.email) {
                localStorage.setItem("gym_checkin_email", checkinData.data.member.email);
              }
              return;
            }
          }
        }
        
        // Step B: Check if email is cached in localStorage
        const cachedEmail = localStorage.getItem("gym_checkin_email");
        if (cachedEmail) {
          // Auto-submit check-in using cached email
          setStatus("submitting");
          const cachedRes = await fetch("/api/attendance/checkin-by-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: cachedEmail }),
          });
          const cachedData = await cachedRes.json();
          
          if (cachedRes.ok && cachedData.success) {
            setStatus("success");
            setMessage(cachedData.message || "Successfully checked in!");
            setMemberData(cachedData.data.member);
            return;
          } else {
            // Cached email failed (possibly expired subscription or deleted account)
            // Go to prompt but prefill the failed email
            setEmailInput(cachedEmail);
          }
        }

        // Default: No session and no working cached email
        setStatus("email-prompt");
      } catch (error) {
        console.error("Initial verification failed:", error);
        setStatus("email-prompt");
      }
    };

    runInitialVerify();
  }, [router]);

  // Cleanup scanner on tab changes or unmount
  useEffect(() => {
    if (activeTab !== "camera" && html5QrcodeScanner) {
      html5QrcodeScanner.stop()
        .then(() => {
          setHtml5QrcodeScanner(null);
          setScannerActive(false);
        })
        .catch((err: any) => console.warn("Failed to stop scanner on tab change", err));
    }
  }, [activeTab, html5QrcodeScanner]);

  useEffect(() => {
    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().catch((err: any) => console.warn("Cleanup stop failed", err));
      }
    };
  }, [html5QrcodeScanner]);

  // 2. Submit manual email check-in
  const handleEmailCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/attendance/checkin-by-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: emailInput.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message || "Successfully checked in!");
        setMemberData(data.data.member);
        
        // Cache the successful email
        if (data.data.member.email) {
          localStorage.setItem("gym_checkin_email", data.data.member.email);
        }
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to check in.");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("A connection issue occurred. Please check your internet connection.");
    }
  };

  // 3. Start Camera Scanner
  const startCameraScanner = async () => {
    setScannerActive(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const qrScanner = new Html5Qrcode("qr-reader");
      setHtml5QrcodeScanner(qrScanner);

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      await qrScanner.start(
        { facingMode: "environment" },
        config,
        async (decodedText: string) => {
          // Code scanned! Stop scanner immediately
          try {
            await qrScanner.stop();
          } catch (e) {
            console.warn("Failed to stop scanner on code catch", e);
          }
          setHtml5QrcodeScanner(null);
          setScannerActive(false);

          // Handle check-in with scanned value (email or memberId)
          await submitCheckin(decodedText);
        },
        () => {
          // Frame parsed, code not found
        }
      );
    } catch (error: any) {
      console.error("Camera access failed:", error);
      alert("Could not access camera. Please verify camera permissions or type your email.");
      setScannerActive(false);
      setHtml5QrcodeScanner(null);
    }
  };

  // 4. Submit scanned code (either email, ID, or complete URL)
  const submitCheckin = async (scannedValue: string) => {
    setStatus("submitting");
    let identifier = scannedValue.trim();

    // Check if scanned value is a checkin URL, extract the path/parameters
    try {
      if (identifier.startsWith("http://") || identifier.startsWith("https://")) {
        const url = new URL(identifier);
        // Extract memberId parameter or path segments
        const pathSegments = url.pathname.split("/");
        // Segment could be /member/ID or parameter
        const emailParam = url.searchParams.get("email");
        if (emailParam) {
          identifier = emailParam;
        } else {
          // Fallback to last segment if it looks like MongoDB ObjectId or email
          const lastSeg = pathSegments[pathSegments.length - 1];
          if (lastSeg) {
            identifier = lastSeg;
          }
        }
      }
    } catch (e) {
      console.warn("Decoded text was not a URL, using raw scanned value", e);
    }

    try {
      const res = await fetch("/api/attendance/checkin-by-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message || "Successfully checked in!");
        setMemberData(data.data.member);

        // Cache the successful email
        if (data.data.member.email) {
          localStorage.setItem("gym_checkin_email", data.data.member.email);
        }
      } else {
        setStatus("error");
        setMessage(data.message || "Attendance log rejected.");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("A connection issue occurred. Please check your internet connection.");
    }
  };

  // 5. Change/Forget Email cache
  const handleResetCheckin = () => {
    localStorage.removeItem("gym_checkin_email");
    setEmailInput("");
    setMemberData(null);
    setStatus("email-prompt");
    setActiveTab("email");
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[20%] left-[-15%] w-[60%] h-[60%] rounded-full bg-[#c39b62]/10 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[60%] rounded-full bg-[#c39b62]/5 blur-[150px] pointer-events-none" />
      </div>

      <div className="w-full max-w-md relative z-10 my-8">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(195,155,98,0.1)] backdrop-blur-2xl bg-[#0B0F19]/80 text-center">
          
          {/* Header Brand */}
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full bg-[#c39b62]/10 border border-[#c39b62]/30 flex items-center justify-center neon-glow">
              <Dumbbell className="w-7 h-7 text-[#c39b62] animate-pulse" />
            </div>
          </div>

          <span className="text-xs font-bold tracking-widest text-[#c39b62] uppercase block mb-1">
            ON FITNESS STUDIO
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-6">
            Self Check-In Portal
          </h1>

          {/* Dynamic Views */}
          <AnimatePresence mode="wait">
            
            {/* 1. Verifying session on load */}
            {status === "verifying" && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 py-8"
              >
                <div className="flex justify-center">
                  <Loader2 className="w-10 h-10 text-[#c39b62] animate-spin" />
                </div>
                <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                  Checking Session
                </h2>
                <p className="text-slate-400 text-sm">
                  Connecting to database to authenticate your gym visit...
                </p>
              </motion.div>
            )}

            {/* 2. Submitting Check-In API Request */}
            {status === "submitting" && (
              <motion.div
                key="submitting"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 py-8"
              >
                <div className="flex justify-center">
                  <Loader2 className="w-10 h-10 text-[#c39b62] animate-spin" />
                </div>
                <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                  Recording Attendance
                </h2>
                <p className="text-slate-400 text-sm">
                  Saving your check-in logs...
                </p>
              </motion.div>
            )}

            {/* 3. Prompting for Email or Scanner */}
            {status === "email-prompt" && (
              <motion.div
                key="prompt"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Tabs Selectors */}
                <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab("email")}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === "email"
                        ? "bg-[#c39b62] text-black shadow-md font-extrabold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" /> Email check-in
                  </button>
                  <button
                    onClick={() => setActiveTab("camera")}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === "camera"
                        ? "bg-[#c39b62] text-black shadow-md font-extrabold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Scan className="w-3.5 h-3.5" /> Camera Scanner
                  </button>
                </div>

                {/* Tab: Email Form */}
                {activeTab === "email" && (
                  <form onSubmit={handleEmailCheckin} className="space-y-4 text-left">
                    <div>
                      <label className="text-xxs text-slate-400 uppercase font-bold tracking-wider mb-1.5 block">
                        Registered Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="member@email.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c39b62] focus:ring-1 focus:ring-[#c39b62] text-sm placeholder:text-slate-600 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-4.5 rounded-xl bg-gradient-to-r from-[#c39b62] to-[#b8956c] text-black font-extrabold uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(195,155,98,0.25)] cursor-pointer"
                    >
                      Check In <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* Tab: Camera QR Scanner */}
                {activeTab === "camera" && (
                  <div className="space-y-4">
                    {!scannerActive ? (
                      <div className="py-8 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/2 space-y-4">
                        <Camera className="w-12 h-12 text-[#c39b62]/40" />
                        <div className="text-center px-4">
                          <p className="text-sm font-semibold">Ready to scan gym card</p>
                          <p className="text-xs text-slate-500 mt-1 max-w-[250px]">
                            Point your device camera at the membership check-in QR code.
                          </p>
                        </div>
                        <button
                          onClick={startCameraScanner}
                          className="px-6 py-3 rounded-xl bg-[#c39b62] text-black font-extrabold uppercase tracking-wider text-xs hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
                        >
                          Start Camera
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div 
                          id="qr-reader" 
                          className="w-full aspect-square bg-slate-950 border border-white/15 rounded-2xl overflow-hidden shadow-inner relative"
                        >
                          {/* Laser Scanner animation effect */}
                          <div className="absolute left-0 right-0 top-0 h-0.5 bg-[#c39b62] shadow-[0_0_15px_#c39b62] animate-bounce z-10" />
                        </div>
                        <button
                          onClick={() => {
                            if (html5QrcodeScanner) {
                              html5QrcodeScanner.stop()
                                .then(() => {
                                  setHtml5QrcodeScanner(null);
                                  setScannerActive(false);
                                })
                                .catch(console.error);
                            }
                          }}
                          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-xs uppercase cursor-pointer"
                        >
                          Cancel Camera
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-note login */}
                <div className="pt-2 border-t border-white/5 text-xs text-slate-500">
                  Registered members can also{" "}
                  <Link href="/member/login?redirect=/checkin" className="text-[#c39b62] hover:underline font-semibold">
                    log in
                  </Link>{" "}
                  for card-free automatic checks.
                </div>
              </motion.div>
            )}

            {/* 4. Success Screen */}
            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 py-4"
              >
                <div className="flex justify-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                </div>
                
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                    Welcome, {memberData?.fullName}!
                  </h2>
                  <p className="text-green-500 font-semibold text-sm mt-1">
                    Attendance Recorded Successfully
                  </p>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl max-w-xs mx-auto">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Total Gym Visits</p>
                  <p className="text-3xl font-black text-white mt-1">{memberData?.attendanceCount}</p>
                </div>

                <p className="text-slate-400 text-sm italic max-w-xs mx-auto px-4">
                  "No shortcuts. Work hard, stay consistent, and crush your goals."
                </p>

                <div className="pt-4 flex flex-col gap-3 max-w-xs mx-auto">
                  <Link 
                    href="/member" 
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#c39b62] to-[#b8956c] text-black font-extrabold uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(195,155,98,0.25)]"
                  >
                    Go to Portal <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button 
                    onClick={handleResetCheckin}
                    className="w-full py-3.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs font-semibold text-slate-400 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Use a different email
                  </button>
                </div>
              </motion.div>
            )}

            {/* 5. Error Screen */}
            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 py-4"
              >
                <div className="flex justify-center">
                  <XCircle className="w-16 h-16 text-[#c39b62] animate-bounce" />
                </div>
                
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                    Check-In Failed
                  </h2>
                  <p className="text-[#c39b62] font-semibold text-sm mt-1">
                    Access Denied
                  </p>
                </div>

                <div className="p-4 bg-[#c39b62]/10 border border-[#c39b62]/20 text-slate-200 text-sm rounded-2xl leading-relaxed max-w-xs mx-auto">
                  {message}
                </div>

                <div className="pt-4 flex flex-col gap-3 max-w-xs mx-auto">
                  <button 
                    onClick={() => {
                      setStatus("email-prompt");
                    }}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#c39b62] to-[#b8956c] text-black font-extrabold uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(195,155,98,0.25)] cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" /> Try Again
                  </button>
                  <button 
                    onClick={handleResetCheckin}
                    className="w-full py-3.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs font-semibold text-slate-400 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Use a different email
                  </button>
                  <Link 
                    href="/" 
                    className="w-full py-3.5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-slate-200"
                  >
                    <Home className="w-3.5 h-3.5" /> Home Page
                  </Link>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
          
        </div>
      </div>
    </div>
  );
}
