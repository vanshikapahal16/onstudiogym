"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Download, QrCode, ShieldAlert, CheckCircle, ShieldCheck } from "lucide-react";

interface QRCodeResponse {
  qrPng: string;
  qrSvg: string;
  qrIdentifier: string;
  expiresAt: string;
}

export default function MemberQRPage() {
  const [qrData, setQrData] = useState<QRCodeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(300);

  // Fetch QR Code from API
  const fetchQRCode = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/member/qrcode");
      const data = await res.json();
      if (data.success) {
        setQrData(data.data);
        const expiresTime = new Date(data.data.expiresAt).getTime();
        const diffSeconds = Math.max(0, Math.floor((expiresTime - Date.now()) / 1000));
        setSecondsLeft(diffSeconds);
      } else {
        setError(data.message || "Failed to load check-in QR code");
      }
    } catch (err) {
      setError("Network error. Failed to load QR code.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchQRCode();
  }, [fetchQRCode]);

  // Countdown timer
  useEffect(() => {
    if (!qrData || secondsLeft <= 0) {
      if (secondsLeft === 0) {
        fetchQRCode(); // Auto-refresh when expired
      }
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [qrData, secondsLeft, fetchQRCode]);

  // Download actions
  const downloadPng = () => {
    if (!qrData) return;
    const link = document.createElement("a");
    link.href = qrData.qrPng;
    link.download = `my_attendance_qr_${qrData.qrIdentifier}.png`;
    link.click();
  };

  const downloadSvg = () => {
    if (!qrData) return;
    const link = document.createElement("a");
    link.href = qrData.qrSvg;
    link.download = `my_attendance_qr_${qrData.qrIdentifier}.svg`;
    link.click();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-md mx-auto space-y-6 py-4">
      {/* Description header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-black text-gradient uppercase tracking-wider">
          Self Check-In QR
        </h1>
        <p className="text-sm text-muted-foreground">
          Scan your QR code at the reception scanner to check in automatically.
        </p>
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-white/5 to-transparent"
      >
        {/* Glow decoration */}
        <div className="absolute top-[-30%] left-[-30%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[60px] pointer-events-none" />

        {loading && !qrData ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Generating secure check-in token...</p>
          </div>
        ) : error ? (
          <div className="h-64 flex flex-col items-center justify-center p-4 gap-3">
            <ShieldAlert className="w-12 h-12 text-destructive" />
            <p className="text-sm font-semibold text-white">{error}</p>
            <button
              onClick={fetchQRCode}
              className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        ) : (
          qrData && (
            <div className="space-y-6 w-full flex flex-col items-center relative z-10">
              {/* QR Image Frame */}
              <div className="relative p-4 bg-white rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.05)] border border-white/20 transition-all duration-300 hover:scale-[1.02]">
                <img
                  src={qrData.qrPng}
                  alt="Attendance QR Code"
                  className="w-56 h-56 object-contain rounded-2xl select-none"
                  draggable={false}
                />
                
                {secondsLeft === 0 && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-4 gap-2">
                    <ShieldAlert className="w-10 h-10 text-yellow-500" />
                    <p className="text-xs font-bold text-white">QR Code Expired</p>
                    <button
                      onClick={fetchQRCode}
                      className="px-3 py-1.5 bg-primary text-black rounded-lg text-xs font-bold hover:bg-primary/95 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>
                )}
              </div>

              {/* Countdown Tracker */}
              {secondsLeft > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Secure temporary token</span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Expires in:{" "}
                    <span className={`font-mono text-base ${secondsLeft <= 30 ? "text-red-500 animate-pulse" : "text-primary"}`}>
                      {formatTime(secondsLeft)}
                    </span>
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={downloadPng}
                  className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/15 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download PNG
                </button>
                <button
                  onClick={downloadSvg}
                  className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/15 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download SVG
                </button>
              </div>

              <div className="w-full border-t border-white/5 pt-4">
                <button
                  onClick={fetchQRCode}
                  disabled={loading}
                  className="w-full py-3 bg-primary/10 hover:bg-primary/15 border border-primary/20 text-primary rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh QR Code
                </button>
              </div>
            </div>
          )
        )}
      </motion.div>
    </div>
  );
}
