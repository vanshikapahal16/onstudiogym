"use client";

import { motion } from "framer-motion";
import { Bell, CreditCard, Clock, Megaphone, Activity, Trash2, CheckCircle2 } from "lucide-react";

export default function MemberNotifications() {
  const notifications = [
    {
      id: 1,
      type: "payment",
      title: "Payment Successful",
      message: "Your annual membership fee of $499 has been successfully processed.",
      time: "2 hours ago",
      icon: <CreditCard className="w-5 h-5 text-green-500" />,
      unread: true,
      color: "bg-green-500/10 border-green-500/30",
    },
    {
      id: 2,
      type: "announcement",
      title: "New Equipment Added!",
      message: "We've just added 5 new Hammer Strength machines to the weights area. Come check them out!",
      time: "Yesterday",
      icon: <Megaphone className="w-5 h-5 text-primary" />,
      unread: true,
      color: "bg-primary/10 border-primary/30",
    },
    {
      id: 3,
      type: "milestone",
      title: "5 Day Streak!",
      message: "You're on fire! You've hit the gym 5 days in a row. Keep up the great work.",
      time: "2 days ago",
      icon: <Activity className="w-5 h-5 text-orange-500" />,
      unread: false,
      color: "bg-orange-500/10 border-orange-500/30",
    },
    {
      id: 4,
      type: "expiry",
      title: "Membership Expiring Soon",
      message: "Your membership will expire in 45 days. Renew early to lock in your current rate.",
      time: "1 week ago",
      icon: <Clock className="w-5 h-5 text-yellow-500" />,
      unread: false,
      color: "bg-yellow-500/10 border-yellow-500/30",
    },
  ];

  return (
    <div className="space-y-8 pb-10 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" /> Notifications
          </h1>
          <p className="text-muted-foreground text-lg">
            Stay updated with your membership and gym activities.
          </p>
        </motion.div>

        <div className="flex items-center gap-3">
          <button className="text-sm px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors border border-white/10 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Mark all as read
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glass-panel rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden group ${
              notification.unread ? 'border-primary/50 bg-primary/5' : 'border-white/10'
            }`}
          >
            {notification.unread && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary neon-glow" />
            )}
            
            <div className="flex gap-4 items-start">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${notification.color}`}>
                {notification.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`text-lg font-bold ${notification.unread ? 'text-white' : 'text-gray-300'}`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {notification.time}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {notification.message}
                </p>
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
