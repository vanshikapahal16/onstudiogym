"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, CheckCircle2, History, Loader2, Award, Percent, CalendarDays } from "lucide-react";

interface AttendanceLog {
  _id: string;
  userId: string;
  name: string;
  email: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  status: string;
  createdAt: string;
}

export default function MemberAttendance() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/attendance/my-history");
        if (!res.ok) throw new Error("Failed to load attendance logs");
        const data = await res.json();
        
        if (data.success && data.data?.history) {
          setLogs(data.data.history);
        }
      } catch (error) {
        console.error("Failed to load member attendance logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, []);

  // Compute Real Stats
  const totalCount = logs.length;

  // Current Month Count
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
  const currentMonthCount = logs.filter(log => log.date.startsWith(currentMonthStr)).length;

  // Attendance Percentage (Calculated against monthly goal of 20 workouts)
  const monthlyGoal = 20;
  const attendancePercentage = Math.round((currentMonthCount / monthlyGoal) * 100);

  // Last Attendance Date
  const lastAttendanceDate = logs.length > 0 ? logs[0].date : "No records yet";
  const lastAttendanceTime = logs.length > 0 ? logs[0].time : "";

  // Group by date for activity grid in current month
  const getDaysInMonthGrid = () => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const dayGrid = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const attended = logs.some(log => log.date === dayStr);

      dayGrid.push({
        day,
        dateStr: dayStr,
        attended,
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
        <Loader2 className="w-12 h-12 text-[#00FFB2] animate-spin" />
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
            Your <span className="text-[#00FFB2]">Attendance</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Track your consistency, monthly goals, and workout history.
          </p>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Total Attendance"
          value={totalCount.toString()}
          subtitle="Total sessions attended"
          icon={<History className="w-6 h-6 text-[#00FFB2]" />}
          delay={0.1}
        />
        <StatCard 
          title="Current Month"
          value={currentMonthCount.toString()}
          subtitle={`Target: ${monthlyGoal} visits`}
          icon={<Calendar className="w-6 h-6 text-blue-500" />}
          delay={0.2}
        />
        <StatCard 
          title="Attendance rate"
          value={`${attendancePercentage}%`}
          subtitle={`Based on ${monthlyGoal} days goal`}
          icon={<Percent className="w-6 h-6 text-purple-500" />}
          delay={0.3}
        />
        <StatCard 
          title="Last Check-in"
          value={lastAttendanceDate}
          subtitle={lastAttendanceTime ? `At ${lastAttendanceTime}` : "No check-ins"}
          icon={<Award className="w-6 h-6 text-[#c39b62]" />}
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Heatmap / Calendar View */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-[#0B0F19]/60 backdrop-blur-md rounded-3xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Activity Grid</h2>
            <div className="text-sm font-semibold text-slate-300 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
              {monthNames[now.getMonth()]} {now.getFullYear()}
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center text-xs text-muted-foreground mb-2">{day}</div>
            ))}
            
            {/* Blank placeholders for first day offset of current month */}
            {Array.from({ length: new Date(now.getFullYear(), now.getMonth(), 1).getDay() }).map((_, i) => (
              <div key={`offset-${i}`} className="aspect-square opacity-0" />
            ))}

            {getDaysInMonthGrid().map(({ day, attended, dateStr }) => {
              let bgColor = "bg-white/5 border-white/5";
              let glowClass = "";
              if (attended) {
                bgColor = "bg-[#00FFB2] text-[#0B0F19] font-bold border-[#00FFB2]";
                glowClass = "shadow-[0_0_10px_rgba(0,255,178,0.25)]";
              }

              return (
                <div 
                  key={day} 
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs ${bgColor} border ${glowClass} transition-all hover:scale-110 cursor-pointer`}
                  title={`${dateStr}: ${attended ? "Attended" : "No record"}`}
                >
                  <span className={attended ? "text-[#0B0F19]" : "text-slate-400"}>{day}</span>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center justify-end gap-3 mt-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-white/5 border border-white/10"></div>
              <span>No Check-in</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#00FFB2]"></div>
              <span>Attended</span>
            </div>
          </div>
        </motion.div>

        {/* Recent Attendance History Table / Timeline */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#0B0F19]/60 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col max-h-[500px]"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Logs</h2>
            <CalendarDays className="w-5 h-5 text-[#00FFB2]" />
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 gap-2">
                <History className="w-8 h-8 text-slate-600 animate-pulse" />
                <p className="text-sm text-slate-400">No visits logged yet.</p>
              </div>
            ) : (
              logs.slice(0, 15).map((visit, i) => {
                // Parse date string nicely
                const parts = visit.date.split("-");
                const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                const formattedDate = dateObj.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
                
                return (
                  <div key={visit._id} className="flex gap-4 relative">
                    {i !== logs.slice(0, 15).length - 1 && (
                      <div className="absolute left-[19px] top-8 bottom-[-16px] w-0.5 bg-white/10"></div>
                    )}
                    <div className="w-10 h-10 rounded-full bg-[#00FFB2]/10 border border-[#00FFB2]/30 flex items-center justify-center shrink-0 z-10 text-[#00FFB2]">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-bold text-white text-sm">{formattedDate}</p>
                        <span className="text-[10px] text-black bg-[#00FFB2] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                          {visit.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 mt-2">
                        <span>Check-in Time</span>
                        <span className="font-mono text-white">{visit.time}</span>
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
      className="bg-[#0B0F19]/60 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex items-center justify-between group hover:border-[#00FFB2]/50 transition-colors duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
    >
      <div>
        <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-black text-white mb-1 tracking-tight">{value}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
        {icon}
      </div>
    </motion.div>
  );
}
