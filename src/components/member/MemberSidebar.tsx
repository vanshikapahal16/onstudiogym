"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Clock,
  CreditCard,
  CalendarDays,
  Dumbbell,
  User,
  Bell,
  LogOut,
  QrCode,
} from "lucide-react";

import { useClerk } from "@clerk/nextjs";

const navItems = [
  { name: "Dashboard", href: "/member", icon: LayoutDashboard },
  { name: "My QR Code", href: "/member/qr", icon: QrCode },
  { name: "Attendance", href: "/member/attendance", icon: Clock },
  { name: "Payments", href: "/member/payments", icon: CreditCard },
  { name: "Membership", href: "/member/payments#membership", icon: CalendarDays },
  { name: "Exercise Library", href: "/member/exercises", icon: Dumbbell },
  { name: "Profile", href: "/member/profile", icon: User },
  { name: "Notifications", href: "/member/notifications", icon: Bell },
];

interface MemberSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function MemberSidebar({ isOpen, onClose }: MemberSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const [member, setMember] = useState<{ fullName: string; email?: string; phoneNumber: string; profileImage?: string } | null>(null);

  useEffect(() => {
    fetch("/api/member/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.member) {
          setMember(data.data.member);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch("/api/member/logout", { method: "POST" });
      await signOut({ redirectUrl: "/member/login" });
    } catch (err) {
      console.error("Logout error:", err);
    }
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
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary flex items-center justify-center neon-glow">
            <span className="text-primary font-bold text-lg">O</span>
          </div>
          <span className="text-xl font-bold tracking-wider text-gradient">
            ON FITNESS
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive =
            item.href === "/member"
              ? pathname === "/member"
              : pathname?.startsWith(item.href.split("#")[0]);

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
                    layoutId="memberActiveTab"
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
          <Link href="/member/profile" onClick={onClose} className="flex flex-1 items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-0.5">
              <div className="w-full h-full bg-background rounded-full flex items-center justify-center overflow-hidden">
                {member?.profileImage ? (
                  <img src={member.profileImage} alt={member.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {member ? getInitials(member.fullName) : "ME"}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {member ? member.fullName : "Member"}
              </p>
              <p className="text-xs text-primary truncate">
                Gym Member
              </p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
