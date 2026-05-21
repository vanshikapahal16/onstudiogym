"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Search, UserCheck, Clock, ArrowRight, Activity, X, User } from "lucide-react";
import Link from "next/link";

interface AttendanceLog {
  _id: string;
  memberId: {
    _id: string;
    fullName: string;
    phoneNumber: string;
    profileImage?: string;
  };
  checkIn: string;
  checkOut?: string;
  duration?: number;
}

interface MemberSearchResult {
  _id: string;
  fullName: string;
  phoneNumber: string;
  profileImage?: string;
  membershipStatus: string;
  attendanceCount: number;
}

export default function AttendancePage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"inside" | "all">("inside");
  
  // Manual Entry States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      handleSearch();
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance?limit=50");
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
      }
    } catch (error) {
      console.error("Failed to fetch attendance logs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setSearching(true);
    try {
      const res = await fetch(`/api/members?search=${searchQuery}&limit=5`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data.members);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error("Failed to search members", error);
    } finally {
      setSearching(false);
    }
  };

  const handleCheckIn = async (memberId: string) => {
    try {
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Member checked in successfully!");
        setSearchQuery("");
        setShowSearchResults(false);
        fetchLogs();
      } else {
        alert(data.message || "Failed to check in");
      }
    } catch (error: any) {
      alert("Error checking in: " + error.message);
    }
  };

  const handleCheckOut = async (memberId: string) => {
    try {
      const res = await fetch("/api/attendance/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Member checked out successfully!");
        setSearchQuery("");
        setShowSearchResults(false);
        fetchLogs();
      } else {
        alert(data.message || "Failed to check out");
      }
    } catch (error: any) {
      alert("Error checking out: " + error.message);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!log.memberId) return false;
    if (activeTab === "inside") {
      return !log.checkOut;
    }
    return true;
  });

  const insideCount = logs.filter((log) => !log.checkOut && log.memberId).length;

  const getDurationText = (mins?: number) => {
    if (mins === undefined) return "Calculating...";
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hrs === 0) return `${remainingMins}m`;
    return `${hrs}h ${remainingMins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: QR & Fast Entry */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50 pointer-events-none" />
            <h3 className="text-lg font-bold text-white mb-2 relative z-10">Entrance QR Code</h3>
            <p className="text-sm text-muted-foreground mb-6 relative z-10">Print/display QR poster at gym door</p>
            
            <div className="relative w-40 h-40 bg-white p-3 rounded-2xl flex items-center justify-center mb-6 z-10">
              <QrCode className="w-24 h-24 text-slate-850" />
            </div>
            
            <Link 
              href="/admin/common-qr" 
              className="px-4 py-2.5 bg-primary text-black font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-primary/90 transition-all relative z-10 w-full"
            >
              Get Entrance Poster
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-6 rounded-2xl border border-white/10 relative z-20"
          >
            <h3 className="text-lg font-bold text-white mb-4">Manual Entry Check-In</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search member by name/phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Live Dropdown Search Results */}
            <AnimatePresence>
              {showSearchResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 mt-2 bg-[#0B0F19] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-30 divide-y divide-white/5"
                >
                  {searchResults.map((m) => {
                    const isInside = logs.some((l) => l.memberId && l.memberId._id === m._id && !l.checkOut);
                    return (
                      <div key={m._id} className="p-3 hover:bg-white/5 flex items-center justify-between gap-3 text-left">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-white truncate">{m.fullName}</p>
                          <p className="text-xs text-muted-foreground">{m.phoneNumber}</p>
                          <p className="text-[10px] text-primary">Status: {m.membershipStatus}</p>
                        </div>
                        <button
                          onClick={() => isInside ? handleCheckOut(m._id) : handleCheckIn(m._id)}
                          disabled={m.membershipStatus === "Expired"}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            m.membershipStatus === "Expired" ? "bg-red-500/20 text-red-500 cursor-not-allowed" :
                            isInside ? "bg-yellow-500 text-black hover:bg-yellow-400" :
                            "bg-primary text-black hover:bg-primary/90"
                          }`}
                        >
                          {m.membershipStatus === "Expired" ? "Expired" : isInside ? "Check Out" : "Check In"}
                        </button>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right Column: Live Feed & Active Members */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-5 rounded-2xl border border-primary/20 bg-primary/5"
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-muted-foreground">Currently Inside</p>
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-3xl font-extrabold text-white">{insideCount}</h3>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-panel p-5 rounded-2xl border border-secondary/20 bg-secondary/5"
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-muted-foreground">Total Logs today</p>
                <UserCheck className="w-4 h-4 text-secondary" />
              </div>
              <h3 className="text-3xl font-extrabold text-white">{logs.length}</h3>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col min-h-[500px]"
          >
            {/* Table Control Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-lg font-bold text-white">Active Members Log</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("inside")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "inside" ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  Inside ({insideCount})
                </button>
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "all" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  All Logs
                </button>
              </div>
            </div>

            {/* List Feed Container */}
            <div className="flex-1 overflow-x-auto p-4">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground">Loading attendance log from database...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 gap-3">
                  <Clock className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "inside" ? "No checked-in members inside the gym right now." : "No attendance activity recorded yet."}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[600px] table-auto">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Member</th>
                      <th className="pb-3 font-semibold">Session Status</th>
                      <th className="pb-3 font-semibold">Entry Time</th>
                      <th className="pb-3 font-semibold">Visit Duration</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-white/5 transition-colors group">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                              {log.memberId.profileImage ? (
                                <img src={log.memberId.profileImage} alt={log.memberId.fullName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-white">{log.memberId.fullName.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{log.memberId.fullName}</p>
                              <p className="text-xs text-muted-foreground">{log.memberId.phoneNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          {log.checkOut ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/5 text-muted-foreground border border-white/10">
                              Checked Out
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              Inside
                            </span>
                          )}
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-white">
                            {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(log.checkIn).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-1.5 text-sm text-white">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {log.checkOut ? getDurationText(log.duration) : "Ongoing session"}
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          {!log.checkOut && (
                            <button
                              onClick={() => handleCheckOut(log.memberId._id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all text-xs font-bold cursor-pointer"
                            >
                              Check Out <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
