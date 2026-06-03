"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

function SSOCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const complete = searchParams.get("complete");
  const [error, setError] = useState("");

  useEffect(() => {
    if (complete === "true") {
      // Sync Clerk session to our local JWT cookie
      fetch("/api/member/sync", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            router.push("/member");
            router.refresh();
          } else {
            setError(data.message || "Failed to sync session. Please try again.");
          }
        })
        .catch((err) => {
          console.error("Sync error:", err);
          setError("An error occurred during session synchronization.");
        });
    }
  }, [complete, router]);

  if (complete === "true") {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="glass-panel p-8 rounded-3xl border border-white/10 flex flex-col items-center max-w-sm w-full text-center bg-[#0B0F19]/80 backdrop-blur-2xl">
          {error ? (
            <>
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
                <span className="text-red-500 text-xl font-bold">!</span>
              </div>
              <h2 className="text-lg font-bold mb-2">Sync Failed</h2>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              <button
                onClick={() => router.push("/member/login")}
                className="w-full py-3 rounded-xl bg-white text-black font-bold uppercase tracking-wider text-xs cursor-pointer"
              >
                Back to Login
              </button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full border-2 border-[#00FFB2] border-t-transparent animate-spin mb-4" />
              <h2 className="text-lg font-bold mb-2">Synchronizing Session</h2>
              <p className="text-sm text-muted-foreground">Setting up your secure member profile...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return <AuthenticateWithRedirectCallback />;
}

export default function SSOCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 text-white text-sm font-sans uppercase tracking-widest">
        Verifying Authentication...
      </div>
    }>
      <SSOCallbackContent />
    </Suspense>
  );
}
