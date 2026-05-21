"use client";

import { motion } from "framer-motion";
import { CalendarDays, AlertTriangle, ShieldCheck, History } from "lucide-react";

export default function MembershipsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Memberships</p>
              <h3 className="text-2xl font-bold text-white">1,180</h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-2xl border border-warning/20 bg-warning/5 relative overflow-hidden"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-warning/20">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expiring in 7 Days</p>
              <h3 className="text-2xl font-bold text-warning">45</h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6 rounded-2xl border border-destructive/20 bg-destructive/5 relative overflow-hidden"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-destructive/20">
              <History className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recently Expired</p>
              <h3 className="text-2xl font-bold text-destructive">23</h3>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel rounded-2xl border border-white/10 flex flex-col overflow-hidden"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Membership Renewals & Expiry
          </h3>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-white/10 text-sm font-medium text-white hover:bg-white/20 transition-colors">Expiring Soon</button>
            <button className="px-4 py-2 rounded-lg bg-transparent text-sm font-medium text-muted-foreground hover:bg-white/5 transition-colors">All Records</button>
          </div>
        </div>
        
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Member</th>
                <th className="p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Join Date</th>
                <th className="p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Expiry Date</th>
                <th className="p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Progress</th>
                <th className="p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { name: "Suresh Pillai", join: "01 Jan 2026", expiry: "01 Feb 2026", progress: 95, days: "2 days left", color: "bg-warning" },
                { name: "Rohit Sharma", join: "15 Oct 2025", expiry: "15 Apr 2026", progress: 60, days: "68 days left", color: "bg-primary" },
                { name: "Anita Desai", join: "10 Dec 2025", expiry: "10 Jan 2026", progress: 100, days: "Expired", color: "bg-destructive" },
                { name: "Karan Gupta", join: "05 Feb 2026", expiry: "05 May 2026", progress: 15, days: "85 days left", color: "bg-primary" },
              ].map((m, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-bold text-white">{m.name}</p>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{m.join}</td>
                  <td className="p-4 text-sm text-white font-medium">{m.expiry}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden w-32">
                        <div className={`h-full ${m.color}`} style={{ width: `${m.progress}%` }} />
                      </div>
                      <span className={`text-xs font-medium ${m.progress === 100 ? 'text-destructive' : m.progress > 85 ? 'text-warning' : 'text-muted-foreground'}`}>{m.days}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all text-sm font-medium">
                      Renew
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
