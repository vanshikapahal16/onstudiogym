"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, RefreshCw, X, CheckCircle, AlertTriangle, ArrowLeft, FlipHorizontal } from "lucide-react";
import jsQR from "jsqr";

interface ScanResult {
  success: boolean;
  memberName?: string;
  membershipStatus?: string;
  message: string;
}

export default function AttendanceScannerPage() {
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [scanning, setScanning] = useState<boolean>(true);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Play synthetic chime using Web Audio API
  const playChime = useCallback((isSuccess: boolean) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        // Success double chime (A5 then C6)
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);

        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
          gain2.gain.setValueAtTime(0.08, ctx.currentTime);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.12);
        }, 90);
      } else {
        // Failure buzz
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (err) {
      console.warn("Web Audio API not supported or interaction blocked:", err);
    }
  }, []);

  // Initialize and list video devices
  useEffect(() => {
    const initDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0) {
          // Default to the last device (often the back camera on mobile devices)
          setSelectedDeviceId(videoInputs[videoInputs.length - 1].deviceId);
        }
      } catch (err) {
        console.error("Error listing devices:", err);
      }
    };

    initDevices();
  }, []);

  // Stop current video stream
  const stopCamera = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Send token to backend check-in scan endpoint
  const handleScanMatch = useCallback(
    async (qrToken: string) => {
      setScanning(false);
      setLoading(true);
      try {
        const res = await fetch("/api/attendance/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            qrToken,
            deviceInfo: `Reception Kiosk webcam (${navigator.userAgent})`,
          }),
        });

        const data = await res.json();
        const success = data.success === true;
        playChime(success);

        setScanResult({
          success,
          memberName: data.data?.memberName,
          membershipStatus: data.data?.membershipStatus,
          message: data.message || (success ? "Checked in successfully" : "Scan failed"),
        });
      } catch (err) {
        playChime(false);
        setScanResult({
          success: false,
          message: "Network request failed. Check server connectivity.",
        });
      } finally {
        setLoading(false);
      }
    },
    [playChime]
  );

  // Start decoding loop
  const startScanningLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) return;

    const tick = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Match canvas dimensions to video
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;

        // Draw video frame to hidden canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Fetch frame image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Decode QR using jsQR
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          // Matched! Trigger backend validation
          handleScanMatch(code.data);
          return;
        }
      }

      if (scanning) {
        animationFrameIdRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(tick);
  }, [scanning, handleScanMatch]);

  // Start webcam capture
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!selectedDeviceId) return;

    const constraints = {
      video: {
        deviceId: { exact: selectedDeviceId },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // required to prevent iOS Safari fullscreen
        videoRef.current.play();
        setHasCameraAccess(true);
        startScanningLoop();
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setHasCameraAccess(false);
      setCameraError(err.message || "Failed to initialize camera. Ensure permissions are granted.");
    }
  }, [selectedDeviceId, stopCamera, startScanningLoop]);

  // Handle camera toggles / selections
  useEffect(() => {
    if (selectedDeviceId && scanning) {
      startCamera();
    }
    return () => stopCamera();
  }, [selectedDeviceId, scanning, startCamera, stopCamera]);

  // Reset function to resume scanning
  const resetScanner = () => {
    setScanResult(null);
    setScanning(true);
  };

  // Auto-reset scan results after 4 seconds (for hands-free reception desk workflow)
  useEffect(() => {
    if (scanResult) {
      const timeout = setTimeout(() => {
        resetScanner();
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [scanResult]);

  const toggleCamera = () => {
    if (videoDevices.length <= 1) return;
    const currentIndex = videoDevices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    setSelectedDeviceId(videoDevices[nextIndex].deviceId);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col justify-between py-4 space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/attendance"
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all hover:text-primary text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">
              Self Check-In Scanner
            </h1>
            <p className="text-xs text-muted-foreground">Camera-based dynamic token scanner</p>
          </div>
        </div>

        {videoDevices.length > 1 && (
          <button
            onClick={toggleCamera}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
          >
            <FlipHorizontal className="w-4 h-4 text-primary" /> Flip Camera
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 items-center justify-center">
        {/* Scanner Viewport */}
        <div className="relative w-full max-w-lg aspect-square lg:aspect-video rounded-3xl overflow-hidden border border-white/10 glass-panel shadow-2xl bg-black flex items-center justify-center">
          {hasCameraAccess === null ? (
            <div className="text-center space-y-3 p-6">
              <Camera className="w-12 h-12 text-muted-foreground/40 mx-auto animate-pulse" />
              <p className="text-sm text-muted-foreground">Requesting camera access...</p>
            </div>
          ) : hasCameraAccess === false ? (
            <div className="text-center space-y-4 p-8">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Camera Access Blocked</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  {cameraError || "Please allow camera access in your browser settings to scan QR Codes."}
                </p>
              </div>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-primary text-black text-xs font-bold rounded-xl hover:bg-primary/95 transition-all cursor-pointer uppercase tracking-wider"
              >
                Retry Camera Connection
              </button>
            </div>
          ) : (
            <>
              {/* Webcam Video Stream */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover pointer-events-none"
                style={{ transform: "scaleX(1)" }} // mirror off to preserve scanning logic
              />

              {/* Hidden decode Canvas */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Active Scanner Frame Guide */}
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* Scan target reticle */}
                  <div className="w-64 h-64 border-2 border-primary/40 rounded-3xl relative flex items-center justify-center">
                    {/* Corner accents */}
                    <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl" />

                    {/* Animated scanning laser line */}
                    <motion.div
                      className="absolute left-4 right-4 h-0.5 bg-primary shadow-[0_0_15px_#c39b62]"
                      animate={{
                        top: ["10%", "90%", "10%"],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Loading overlay during scan verification */}
          {loading && (
            <div className="absolute inset-0 bg-[#0B0F19]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-white">Validating QR signature...</p>
            </div>
          )}
        </div>

        {/* Instructions Panel */}
        <div className="w-full max-w-xs space-y-4 text-center lg:text-left">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-primary">
              Instructions
            </h3>
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Members must open the "My QR Code" view in their portal.</li>
              <li>Hold the phone screen 10-15 cm in front of this camera.</li>
              <li>Align the QR code inside the green marker guides.</li>
              <li>Wait for the confirmation chime. Attendance marks automatically.</li>
            </ol>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <p className="text-[10px] uppercase text-muted-foreground font-bold">Kiosk Mode</p>
            <p className="text-xs text-white">
              Continuous scanning mode. Scanner automatically resets 4 seconds after a scan is displayed.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Results Overlays */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-x-4 bottom-4 md:inset-x-auto md:right-4 md:w-96 z-50"
          >
            <div
              className={`p-6 rounded-2xl shadow-2xl border flex items-start gap-4 ${
                scanResult.success
                  ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-100"
                  : "bg-red-950/90 border-red-500/30 text-red-100"
              } backdrop-blur-xl`}
            >
              <div className="p-2 rounded-xl bg-white/10">
                {scanResult.success ? (
                  <CheckCircle className="w-6 h-6 text-emerald-400 animate-bounce" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                )}
              </div>

              <div className="flex-1 space-y-1 min-w-0">
                <p className="text-sm font-black tracking-wide uppercase">
                  {scanResult.success ? "Check-in Successful" : "Check-in Rejected"}
                </p>
                {scanResult.success && scanResult.memberName && (
                  <div className="space-y-0.5">
                    <p className="text-base font-extrabold text-white truncate">{scanResult.memberName}</p>
                    <span className="inline-flex px-2 py-0.5 bg-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      Status: {scanResult.membershipStatus}
                    </span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
                  {scanResult.message}
                </p>
              </div>

              <button
                onClick={resetScanner}
                className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
