"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { QrCode, Search, UserCheck, Clock, Download, Calendar, Mail, User, ShieldAlert, FileSpreadsheet } from "lucide-react";
import Link from "next/link";

interface AttendanceLog {
  _id: string;
  userId: string;
  name: string;
  email: string;
  date: string;
  time: string;
  status: string;
  createdAt: string;
}

interface Stats {
  todayDate: string;
  todayCount: number;
  totalActiveMembers: number;
  attendanceRate: number;
}

interface ReportItem {
  month?: string;
  date?: string;
  count: number;
}

export default function AdminAttendancePage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<{
    monthlyReport: ReportItem[];
    dailyReport: ReportItem[];
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filter States
  const [filterDate, setFilterDate] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterMemberId, setFilterMemberId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/attendance?page=${page}&limit=25`;
      if (filterDate) url += `&date=${filterDate}`;
      if (filterEmail) url += `&email=${encodeURIComponent(filterEmail)}`;
      if (filterMemberId) url += `&memberId=${encodeURIComponent(filterMemberId)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
        setStats(data.data.stats);
        setReports(data.data.reports);
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.pages || 1);
        }
      }
    } catch (error) {
      console.error("Failed to fetch admin attendance logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [filterDate, filterEmail, filterMemberId, page]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      let url = `/api/admin/attendance?export=true`;
      if (filterDate) url += `&date=${filterDate}`;
      if (filterEmail) url += `&email=${encodeURIComponent(filterEmail)}`;
      if (filterMemberId) url += `&memberId=${encodeURIComponent(filterMemberId)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data?.logs) {
        const exportLogs: AttendanceLog[] = data.data.logs;
        
        if (exportLogs.length === 0) {
          alert("No attendance data matches current filters to export.");
          return;
        }

        const headers = ["Member Name", "Email", "Date", "Time", "Status", "Created At"];
        const rows = exportLogs.map(log => [
          log.name,
          log.email,
          log.date,
          log.time,
          log.status,
          new Date(log.createdAt).toLocaleString()
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", downloadUrl);
        link.setAttribute("download", `gym_attendance_${filterDate || "all"}_export.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Failed to export attendance CSV:", error);
      alert("Error exporting CSV data.");
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setFilterDate("");
    setFilterEmail("");
    setFilterMemberId("");
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">
            QR <span className="text-[#c39b62]">Attendance Management</span>
          </h1>
          <p className="text-sm text-slate-400">
            View attendance registers, configure filters, analyze check-in stats, and export CSV reports.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link
            href="/admin/common-qr"
            className="px-4 py-2.5 bg-[#c39b62] hover:bg-[#b8956c] text-black font-extrabold uppercase tracking-wider text-xs rounded-xl flex items-center gap-2 shadow-[0_4px_15px_rgba(195,155,98,0.2)] transition-all"
          >
            <QrCode className="w-4 h-4" /> Get Common QR Poster
          </Link>
          
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-wider text-xs rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#c39b62]" />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Daily Check-Ins"
          value={stats ? stats.todayCount.toString() : "0"}
          subtitle={`Today: ${stats?.todayDate || ""}`}
          icon={<UserCheck className="w-6 h-6 text-[#00FFB2]" />}
        />
        <StatsCard
          title="Active Members"
          value={stats ? stats.totalActiveMembers.toString() : "0"}
          subtitle="Non-suspended accounts"
          icon={<User className="w-6 h-6 text-blue-500" />}
        />
        <StatsCard
          title="Attendance Rate"
          value={stats ? `${stats.attendanceRate}%` : "0%"}
          subtitle="Of active gym members today"
          icon={<Clock className="w-6 h-6 text-[#c39b62]" />}
        />
      </div>

      {/* Primary layout columns: Filters & History */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left column: Sidebar reports & quick filters */}
        <div className="space-y-6 lg:col-span-1">
          {/* Filters Form */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="font-bold text-sm uppercase tracking-wider text-[#c39b62]">Filters</h3>
              {(filterDate || filterEmail || filterMemberId) && (
                <button
                  onClick={handleClearFilters}
                  className="text-xxs uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Filter Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => {
                    setFilterDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#c39b62] transition-colors"
                />
              </div>
            </div>

            {/* Filter Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Search</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="search@email.com..."
                  value={filterEmail}
                  onChange={(e) => {
                    setFilterEmail(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#c39b62] transition-colors"
                />
              </div>
            </div>

            {/* Filter Member ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Member ID</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Mongoose ID..."
                  value={filterMemberId}
                  onChange={(e) => {
                    setFilterMemberId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#c39b62] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Monthly Statistics Report Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
            <h3 className="font-bold text-sm uppercase tracking-wider text-white mb-4 pb-2 border-b border-white/5">
              Monthly Reports
            </h3>
            
            <div className="space-y-3.5">
              {!reports || reports.monthlyReport.length === 0 ? (
                <p className="text-xs text-slate-500">No monthly metrics available.</p>
              ) : (
                reports.monthlyReport.map((rep) => (
                  <div key={rep.month} className="flex justify-between items-center text-xs">
                    <span className="font-mono text-slate-400 uppercase tracking-wider">{rep.month}</span>
                    <span className="font-extrabold text-black bg-[#c39b62] px-2.5 py-0.5 rounded-full text-xxs">
                      {rep.count} check-ins
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: Main table list */}
        <div className="lg:col-span-3">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
              <div>
                <h3 className="font-black uppercase tracking-tight text-white text-base">Attendance Logs</h3>
                <p className="text-xxs text-slate-500 uppercase tracking-widest mt-1">Gym entrance scanning history</p>
              </div>
              <div className="text-xs text-slate-400">
                Found <span className="text-[#c39b62] font-bold">{logs.length}</span> matching entries
              </div>
            </div>

            {/* Logs Table Area */}
            <div className="flex-1 overflow-x-auto p-6">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center py-24 gap-3">
                  <div className="w-8 h-8 border-3 border-[#c39b62] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Loading attendance feed...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-24 gap-3">
                  <ShieldAlert className="w-10 h-10 text-slate-700" />
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">No Check-ins Found</h4>
                  <p className="text-xs text-slate-500 max-w-xs">
                    No gym member check-in registers correspond to the active filter configuration.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse table-auto text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                      <th className="pb-3 font-bold">Member Name</th>
                      <th className="pb-3 font-bold">Email</th>
                      <th className="pb-3 font-bold">Date</th>
                      <th className="pb-3 font-bold">Time</th>
                      <th className="pb-3 font-bold">Status</th>
                      <th className="pb-3 font-bold text-right">User ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 font-bold text-white text-sm">{log.name}</td>
                        <td className="py-3.5 text-slate-400 font-mono">{log.email}</td>
                        <td className="py-3.5 font-medium text-white">{log.date}</td>
                        <td className="py-3.5 text-slate-300 font-mono text-sm">{log.time}</td>
                        <td className="py-3.5">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#00FFB2]/10 text-[#00FFB2] border border-[#00FFB2]/20">
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-mono text-slate-600 text-[10px]" title={log.userId}>
                          {log.userId.substring(0, 8)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                  Page {page} of {totalPages}
                </div>
                <button
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, subtitle, icon }: { title: string; value: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 flex items-center justify-between group hover:border-[#c39b62]/50 transition-colors duration-300 shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
      <div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">{title}</p>
        <h3 className="text-3xl font-black text-white mb-1 tracking-tight">{value}</h3>
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{subtitle}</p>
      </div>
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
    </div>
  );
}
