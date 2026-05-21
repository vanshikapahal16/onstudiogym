"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Clock,
  CreditCard,
  CalendarDays,
  Settings,
  Image,
  LogOut,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Attendance", href: "/admin/attendance", icon: Clock },
  { name: "Members", href: "/admin/members", icon: Users },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Gallery", href: "/admin/gallery", icon: Image },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<{ fullName: string; email: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.admin) {
          setAdmin(data.data.admin);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {}
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside
      className={`w-64 h-screen fixed left-0 top-0 border-r border-white/10 glass-panel flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 bg-[#0B0F19]/95 backdrop-blur-xl ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-white/10 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#c39b62]/20 border border-[#c39b62] flex items-center justify-center shadow-[0_0_15px_rgba(195,155,98,0.3)]">
            <span className="text-[#c39b62] font-black text-sm">ON</span>
          </div>
          <span className="text-xl font-black tracking-widest text-white uppercase">
            ON FITNESS
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 flex flex-col gap-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} onClick={onClose}>
              <div
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "text-primary bg-primary/10 neon-glow"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                <item.icon
                  className={`w-5 h-5 ${isActive ? "text-primary" : ""}`}
                />
                <span className="font-medium">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Area */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-0.5">
            <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {admin ? getInitials(admin.fullName) : "AD"}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {admin ? admin.fullName : "Admin"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {admin ? admin.email : "owner@onfitness.com"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
