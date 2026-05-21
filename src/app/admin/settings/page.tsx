"use client";

import { motion } from "framer-motion";
import { Settings2, BellRing, Shield, User, Building, CreditCard } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="space-y-2">
          {[
            { name: "Gym Details", icon: Building, active: true },
            { name: "Account Profile", icon: User },
            { name: "Notifications", icon: BellRing },
            { name: "Payment Settings", icon: CreditCard },
            { name: "Security", icon: Shield },
            { name: "System Preferences", icon: Settings2 },
          ].map((item, i) => (
            <button
              key={i}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                item.active
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,255,178,0.1)]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <item.icon className={`w-4 h-4 ${item.active ? "text-primary" : ""}`} />
              {item.name}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-3 space-y-6"
        >
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">Gym Information</h3>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Gym Name</label>
                  <input type="text" defaultValue="ON FITNESS STUDIO" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Contact Phone</label>
                  <input type="text" defaultValue="8400050073 / 9017319009" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Address</label>
                  <textarea rows={3} defaultValue="Khubru Road, Near Shiv Garden, Ganaur" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/10">
                <button type="button" className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(0,255,178,0.3)]">
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">Dynamic Pricing Automation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The platform currently uses the Simplified Smart Member Data System. You can enter any custom fee amount during member registration, and the system will automatically handle tracking and partial payments.
            </p>
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-primary mb-1">Smart Tracking Active</h4>
                <p className="text-xs text-primary/80">
                  Partial payments, dues calculation, and expiry tracking are fully automated and running in real-time.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
