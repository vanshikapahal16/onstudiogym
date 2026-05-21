"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, CheckCircle2, History, Loader2 } from "lucide-react";
import { startOfMonth, endOfMonth, isWithinInterval, differenceInDays } from "date-fns";

interface AttendanceLog {
  _id: string;
  checkIn: string;
  checkOut?: string;
  duration?: number;
}

export default function MemberAttendance() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Profile to get member ID
        const profileRes = await fetch("/api/member/profile");
        if (!profileRes.ok) throw new Error("Failed to load profile");
        const profileData = await profileRes.json();
        
        if (profileData.success && profileData.data?.member) {
          const member = profileData.data.member;
          setProfile(member);

          // 2. Fetch Attendance logs for this member
          const logsRes = await fetch(`/api/attendance/${member._id}`);
          if (logsRes.ok) {
            const logsData = await logsRes.json();
            if (logsData.success) {
              setLogs(logsData.data.logs || []);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load member attendance logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, []);

  // Compute Real Stats
  const totalVisits = logs.length;

  const thisMonthVisits = logs.filter((log) => {
    const logDate = new Date(log.checkIn);
    const now = new Date();
    return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
  }).length;

  const validDurations = logs.filter((log) => log.duration && log.duration > 0);
  const avgDurationMins = validDurations.length > 0
    ? Math.round(validDurations.reduce((acc, log) => acc + (log.duration || 0), 0) / validDurations.length)
    : 0;

  const getAvgDurationText = (mins: number) => {
    if (mins === 0) return "N/A";
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hrs === 0) return `${remainingMins}m`;
    return `${hrs}h ${remainingMins}m`;
  };

  const getDurationText = (mins?: number) => {
    if (mins === undefined || mins === 0) return "Ongoing";
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hrs === 0) return `${remainingMins}m`;
    return `${hrs}h ${remainingMins}m`;
  };

  // Generate heatmap grid for current month
  const getDaysInMonthGrid = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const dayGrid = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      
      // Count visits on this day
      const visitsOnDay = logs.filter((log) => {
        const logDate = new Date(log.checkIn);
        return logDate.getDate() === day && logDate.getMonth() === month && logDate.getFullYear() === year;
      }).length;

      dayGrid.push({
        day,
        visits: visitsOnDay,
        dateStr: currentDate.toLocaleDateString(),
      });
    }
    return dayGrid;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm text-slate-400">Loading your attendance record...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Your <span className="text-primary text-gradient">Attendance</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Track your consistency and gym visits.
          </p>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Visits"
          value={totalVisits.toString()}
          subtitle="Since joined"
          icon={<History className="w-6 h-6 text-primary" />}
          delay={0.1}
        />
        <StatCard 
          title="This Month"
          value={thisMonthVisits.toString()}
          subtitle="Target: 20 visits"
          icon={<Calendar className="w-6 h-6 text-blue-500" />}
          delay={0.2}
        />
        <StatCard 
          title="Avg. Duration"
          value={getAvgDurationText(avgDurationMins)}
          subtitle="Per visit"
          icon={<Clock className="w-6 h-6 text-purple-500" />}
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Heatmap / Calendar View */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Activity Grid</h2>
            <div className="text-sm font-semibold text-slate-300 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
              {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center text-xs text-muted-foreground mb-2">{day}</div>
            ))}
            
            {/* Blank placeholders for first day offset */}
            {Array.from({ length: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay() }).map((_, i) => (
              <div key={`offset-${i}`} className="aspect-square opacity-0" />
            ))}

            {getDaysInMonthGrid().map(({ day, visits, dateStr }) => {
              let bgColor = "bg-white/5 border-white/5";
              let glowClass = "";
              if (visits > 0) {
                bgColor = "bg-primary text-black font-bold border-primary";
                glowClass = "neon-glow shadow-[0_0_10px_rgba(239,68,68,0.2)]";
              }

              return (
                <div 
                  key={day} 
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs ${bgColor} border ${glowClass} transition-all hover:scale-110 cursor-pointer`}
                  title={`${dateStr}: ${visits} visit(s)`}
                >
                  <span className={visits > 0 ? "text-[#0B0F19]" : "text-slate-400"}>{day}</span>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center justify-end gap-3 mt-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-white/5 border border-white/10"></div>
              <span>No Visit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary"></div>
              <span>Gym Session Completed</span>
            </div>
          </div>
        </motion.div>

        {/* Timeline Visit History */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col max-h-[500px]"
        >
          <h2 className="text-xl font-bold text-white mb-6">Visit History</h2>
          
          <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 gap-2">
                <Clock className="w-8 h-8 text-slate-600" />
                <p className="text-sm text-slate-400">No visits logged yet.</p>
              </div>
            ) : (
              logs.slice(0, 10).map((visit, i) => {
                const checkInDate = new Date(visit.checkIn);
                const dateStr = checkInDate.toLocaleDateString([], { day: "numeric", month: "short" });
                const timeIn = checkInDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const timeOut = visit.checkOut 
                  ? new Date(visit.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "Active";

                return (
                  <div key={visit._id} className="flex gap-4 relative">
                    {i !== logs.slice(0, 10).length - 1 && (
                      <div className="absolute left-[19px] top-8 bottom-[-16px] w-0.5 bg-white/10"></div>
                    )}
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 z-10 text-primary">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-bold text-white text-sm">{dateStr}</p>
                        <span className="text-xxs text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                          {getDurationText(visit.duration)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>In: {timeIn}</span>
                        <span>Out: {timeOut}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-panel rounded-3xl p-6 border border-white/10 flex items-center justify-between group hover:border-primary/50 transition-colors duration-300"
    >
      <div>
        <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
    </motion.div>
  );
}
