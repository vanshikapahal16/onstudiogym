"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, CalendarDays, Clock, CreditCard, Activity, Flame, Dumbbell, Receipt } from "lucide-react";

interface Member {
  _id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  membershipStatus: "Active" | "Expiring Soon" | "Expired";
  membershipExpiry: string;
  remainingAmount: number;
  joinDate: string;
}

interface AttendanceLog {
  _id: string;
  checkIn: string;
  checkOut?: string;
  duration?: number;
}

interface PaymentLog {
  _id: string;
  amount: number;
  date: string;
  invoiceId: string;
  status: string;
}

export default function MemberDashboard() {
  const [member, setMember] = useState<Member | null>(null);
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile
      const profileRes = await fetch("/api/member/profile");
      const profileData = await profileRes.json();
      if (profileData.success && profileData.data?.member) {
        const m = profileData.data.member;
        setMember(m);

        // 2. Fetch Attendance Logs
        const attRes = await fetch(`/api/attendance/${m._id}`);
        const attData = await attRes.json();
        if (attData.success) {
          setAttendance(attData.data.logs);
        }

        // 3. Fetch Payments Logs
        const payRes = await fetch(`/api/payments/${m._id}`);
        const payData = await payRes.json();
        if (payData.success) {
          setPayments(payData.data.payments);
        }
      }
    } catch (error) {
      console.error("Failed to load member dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (expiryDateStr?: string) => {
    if (!expiryDateStr) return 0;
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getDurationText = (mins?: number) => {
    if (mins === undefined) return "Calculating...";
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hrs === 0) return `${remainingMins}m`;
    return `${hrs}h ${remainingMins}m`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading your fitness portfolio...</p>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(member?.membershipExpiry);
  const totalVisits = attendance.length;
  const lastVisit = attendance[0];

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Welcome back, <span className="text-primary text-gradient">{member ? member.fullName.split(" ")[0] : "Champion"}!</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Ready to crush your workout goals today?
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl glass-panel"
        >
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center neon-glow">
            <Flame className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-xl font-bold text-white">{totalVisits > 5 ? "5 Days" : `${totalVisits} Days`}</p>
          </div>
        </motion.div>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Membership Status"
          value={member ? member.membershipStatus : "Inactive"}
          subtitle={daysRemaining > 0 ? `Expires in ${daysRemaining} days` : "Expired / Expiring"}
          icon={<Activity className="w-6 h-6 text-emerald-400" />}
          delay={0.1}
          glowColor="rgba(16, 185, 129, 0.2)"
        />
        <StatCard
          title="Pending Dues"
          value={member ? `₹${member.remainingAmount.toLocaleString()}` : "₹0"}
          subtitle={member && member.remainingAmount > 0 ? "Outstanding balance" : "All caught up!"}
          icon={<CreditCard className="w-6 h-6 text-primary" />}
          delay={0.2}
          glowColor="rgba(0, 255, 178, 0.2)"
        />
        <StatCard
          title="Total Visits"
          value={totalVisits.toString()}
          subtitle="Lifetime workout logs"
          icon={<CalendarDays className="w-6 h-6 text-blue-500" />}
          delay={0.3}
          glowColor="rgba(59, 130, 246, 0.2)"
        />
        <StatCard
          title="Last Gym Visit"
          value={lastVisit ? new Date(lastVisit.checkIn).toLocaleDateString([], { month: "short", day: "numeric" }) : "Never"}
          subtitle={lastVisit ? `Duration: ${getDurationText(lastVisit.duration)}` : "No workouts logged"}
          icon={<Clock className="w-6 h-6 text-purple-500" />}
          delay={0.4}
          glowColor="rgba(168, 85, 247, 0.2)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions / Today's Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recommended for You</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="group relative overflow-hidden rounded-2xl aspect-[4/3] cursor-pointer border border-white/10">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
              <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop" alt="Workout" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 p-5 z-20">
                <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full mb-2 inline-block backdrop-blur-md border border-primary/30">Strength</span>
                <h3 className="text-lg font-bold text-white mb-1">Full Body Power</h3>
                <p className="text-sm text-gray-300 flex items-center gap-2"><Clock className="w-3 h-3"/> 45 mins • Advanced</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl aspect-[4/3] cursor-pointer border border-white/10">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
              <img src="https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop" alt="Workout" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute bottom-0 left-0 p-5 z-20">
                <span className="px-3 py-1 bg-secondary/20 text-secondary text-xs font-bold rounded-full mb-2 inline-block backdrop-blur-md border border-secondary/30">Cardio</span>
                <h3 className="text-lg font-bold text-white mb-1">HIIT Fat Burn</h3>
                <p className="text-sm text-gray-300 flex items-center gap-2"><Clock className="w-3 h-3"/> 30 mins • Intermediate</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity Log */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col h-[400px]"
        >
          <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>

          <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
            {attendance.length === 0 && payments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                <Dumbbell className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No recent fitness or payment activity logged</p>
              </div>
            ) : (
              [
                ...attendance.map((log) => ({
                  type: "checkin",
                  title: log.checkOut ? "Completed Workout" : "Checked In",
                  subtitle: log.checkOut 
                    ? `Session duration: ${getDurationText(log.duration)}`
                    : "Active training session",
                  date: new Date(log.checkIn),
                  icon: log.checkOut ? <Dumbbell className="w-4 h-4 text-primary" /> : <Activity className="w-4 h-4 text-emerald-400" />
                })),
                ...payments.map((p) => ({
                  type: "payment",
                  title: `Payment: ₹${p.amount.toLocaleString()}`,
                  subtitle: `Invoice: ${p.invoiceId}`,
                  date: new Date(p.date),
                  icon: <Receipt className="w-4 h-4 text-purple-400" />
                }))
              ]
              .sort((a, b) => b.date.getTime() - a.date.getTime())
              .slice(0, 5)
              .map((activity, i, arr) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== arr.length - 1 && <div className="absolute left-[19px] top-8 bottom-[-16px] w-0.5 bg-white/10"></div>}
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 z-10">
                    {activity.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white">{activity.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.subtitle}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {activity.date.toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </p>
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

function StatCard({ title, value, subtitle, icon, delay, glowColor }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-panel rounded-3xl p-6 border border-white/10 relative overflow-hidden group hover:border-primary/50 transition-colors duration-500"
    >
      <div
        className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ backgroundColor: glowColor }}
      />

      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-black text-white mb-1 tracking-tight">{value}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
