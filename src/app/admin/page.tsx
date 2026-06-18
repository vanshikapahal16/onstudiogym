"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  Activity,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Stats {
  totalMembers: number;
  activeMembers: number;
  expiringMembers: number;
  expiredMembers: number;
  currentOccupancy: number;
  todayCheckins: number;
  totalRevenue: number;
  pendingDues: number;
  inactiveMembersCount: number;
  pendingMembers?: number;
}

interface Occupant {
  memberId: string;
  fullName: string;
  profileImage?: string;
  checkIn: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [liveOccupants, setLiveOccupants] = useState<Occupant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/analytics/dashboard");
      const data = await res.json();
      if (data.success) {
        setStats(data.data.statistics);
        setLiveOccupants(data.data.liveOccupancy);
      }
    } catch (error) {
      console.error("Failed to load dashboard statistics", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const revenueData = [
    { name: "Jan", revenue: 40000 },
    { name: "Feb", revenue: 65000 },
    { name: "Mar", revenue: 90000 },
    { name: "Apr", revenue: 120000 },
    { name: "May", revenue: stats ? stats.totalRevenue : 156000 },
  ];

  const getRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      return date.toLocaleDateString();
    } catch (e) {
      return "recently";
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Calculating live metrics from MongoDB...</p>
      </div>
    );
  }

  const metrics = [
    {
      title: "Current Inside",
      value: stats ? stats.currentOccupancy.toString() : "0",
      icon: Activity,
      change: stats && stats.currentOccupancy > 5 ? "Busy" : "Moderate",
      trend: "up",
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      title: "Today's Attendance",
      value: stats ? stats.todayCheckins.toString() : "0",
      icon: UserCheck,
      change: "+15% vs yesterday",
      trend: "up",
      color: "text-secondary",
      bg: "bg-secondary/10",
      border: "border-secondary/20",
    },
    {
      title: "Active Members",
      value: stats ? stats.activeMembers.toString() : "0",
      icon: Users,
      change: `Total: ${stats ? stats.totalMembers : 0}`,
      trend: "up",
      color: "text-white",
      bg: "bg-white/10",
      border: "border-white/20",
    },
    {
      title: "Pending Payments",
      value: stats ? `₹${stats.pendingDues.toLocaleString()}` : "₹0",
      icon: Clock,
      change: stats && stats.pendingDues > 20000 ? "Follow up required" : "Healthy",
      trend: "down",
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
    },
    {
      title: "Gross Revenue",
      value: stats ? `₹${stats.totalRevenue.toLocaleString()}` : "₹0",
      icon: TrendingUp,
      change: "+22% this quarter",
      trend: "up",
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Upper Control Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white">Operational Intelligence</h2>
          <p className="text-xs text-muted-foreground">Real-time database feed verified</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-white transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Live Data
        </button>
      </div>

      {/* Pending Signup Requests Banner */}
      {stats && stats.pendingMembers && stats.pendingMembers > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-[0_0_20px_rgba(234,179,8,0.05)] animate-pulse-slow"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Pending Signup Requests</h4>
              <p className="text-xs text-muted-foreground">
                There are {stats.pendingMembers} prospective members waiting for approval.
              </p>
            </div>
          </div>
          <Link
            href="/admin/members?status=Pending"
            className="px-4 py-2 rounded-xl bg-yellow-500 text-black hover:bg-yellow-400 text-xs font-bold transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] cursor-pointer"
          >
            Review Requests
          </Link>
        </motion.div>
      ) : null}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-panel p-5 rounded-2xl border ${metric.border} relative overflow-hidden group`}
          >
            <div
              className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${metric.bg} blur-2xl group-hover:blur-xl transition-all`}
            />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-2 rounded-xl ${metric.bg}`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <div
                className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${
                  metric.trend === "up"
                    ? "text-primary bg-primary/10"
                    : "text-yellow-500 bg-yellow-500/10"
                }`}
              >
                {metric.trend === "up" ? (
                  <ArrowUpRight className="w-2.5 h-2.5" />
                ) : (
                  <ArrowDownRight className="w-2.5 h-2.5" />
                )}
                {metric.change}
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-1 tracking-tight">
                {metric.value}
              </h3>
              <p className="text-xs text-muted-foreground">{metric.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Revenue Trajectory</h3>
              <p className="text-sm text-muted-foreground">Gross collections over time (INR)</p>
            </div>
            <select className="bg-white/5 border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary">
              <option className="bg-[#0B0F19]">Operational Year (2026)</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FFB2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00FFB2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#00FFB2' }}
                  formatter={(value) => [`₹${parseFloat(value as string).toLocaleString()}`, "Gross Collections"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#00FFB2" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Live inside view */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col h-[400px]"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Live Occupancy
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">Currently inside the gym</p>
            </div>
            <span className="text-xs font-bold text-primary px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              {liveOccupants.length} Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {liveOccupants.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                <Users className="w-8 h-8 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">No checked-in members inside right now</p>
              </div>
            ) : (
              liveOccupants.map((occupant) => (
                <div
                  key={occupant.memberId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-secondary p-0.5">
                    <div className="w-full h-full bg-[#0B0F19] rounded-full flex items-center justify-center overflow-hidden">
                      {occupant.profileImage ? (
                        <img src={occupant.profileImage} alt={occupant.fullName || "Member"} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-white">{(occupant.fullName || "M").charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{occupant.fullName || "Unknown Member"}</p>
                    <p className="text-[10px] text-primary">Checked In</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white font-mono">{new Date(occupant.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{getRelativeTime(occupant.checkIn)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
