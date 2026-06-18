"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CreditCard, Clock, Megaphone, Activity, Trash2, CheckCircle2, Loader2, Sparkles } from "lucide-react";

interface NotificationItem {
  _id: string;
  type: "payment" | "announcement" | "milestone" | "expiry" | "system";
  title: string;
  message: string;
  unread: boolean;
  createdAt: string;
}

export default function MemberNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", { method: "PUT" });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, unread: false }))
        );
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to delete all notifications?")) return;
    try {
      const res = await fetch("/api/notifications", { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  const getNotificationConfig = (type: string) => {
    switch (type) {
      case "payment":
        return {
          icon: <CreditCard className="w-5 h-5 text-green-500" />,
          color: "bg-green-500/10 border-green-500/30",
        };
      case "announcement":
        return {
          icon: <Megaphone className="w-5 h-5 text-primary" />,
          color: "bg-primary/10 border-primary/30",
        };
      case "milestone":
        return {
          icon: <Activity className="w-5 h-5 text-orange-500" />,
          color: "bg-orange-500/10 border-orange-500/30",
        };
      case "expiry":
        return {
          icon: <Clock className="w-5 h-5 text-yellow-500" />,
          color: "bg-yellow-500/10 border-yellow-500/30",
        };
      default:
        return {
          icon: <Bell className="w-5 h-5 text-blue-500" />,
          color: "bg-blue-500/10 border-blue-500/30",
        };
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary animate-bounce" /> Notifications
          </h1>
          <p className="text-muted-foreground text-lg">
            Stay updated with your membership and gym activities.
          </p>
        </motion.div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={handleMarkAllRead}
              className="text-sm px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors border border-white/10 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark all as read
            </button>
            <button 
              onClick={handleClearAll}
              className="text-sm px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {notifications.map((notification, index) => {
            const config = getNotificationConfig(notification.type);
            return (
              <motion.div
                key={notification._id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={`glass-panel rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden group ${
                  notification.unread ? 'border-primary/50 bg-primary/5 shadow-[0_0_15px_rgba(255,255,255,0.02)]' : 'border-white/10'
                }`}
              >
                {notification.unread && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary neon-glow" />
                )}
                
                <div className="flex gap-4 items-start">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${config.color}`}>
                    {config.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-4">
                      <h3 className={`text-lg font-bold truncate ${notification.unread ? 'text-white' : 'text-gray-300'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed break-words">
                      {notification.message}
                    </p>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDelete(notification._id)}
                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {notifications.length === 0 && (
          <div className="text-center py-20 glass-panel rounded-3xl border border-white/10">
            <Sparkles className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-bold text-white mb-2">All caught up!</h3>
            <p className="text-muted-foreground">You have no new notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
