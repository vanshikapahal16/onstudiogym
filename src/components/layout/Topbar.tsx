"use client";

import { Bell, Search, Menu } from "lucide-react";
import { usePathname } from "next/navigation";

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    switch (pathname) {
      case "/admin":
        return "Dashboard overview";
      case "/admin/members":
        return "Manage members";
      case "/admin/attendance":
        return "Live attendance";
      case "/admin/payments":
        return "Financial overview";
      case "/admin/memberships":
        return "Membership tracking";
      case "/admin/gallery":
        return "Manage public gallery";
      case "/admin/settings":
        return "Gym settings";
      default:
        return "Overview";
    }
  };

  const getPageHeading = () => {
    if (pathname === "/admin") return "Dashboard";
    const path = pathname.split("/").pop() || "";
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <header className="h-20 border-b border-white/10 glass-panel sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between bg-[#0B0F19]/90 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors lg:hidden text-white cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {getPageHeading()}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{getPageTitle()}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="relative group hidden md:block">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Quick search member..."
            className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all w-64 glass-panel"
          />
        </div>

        <button className="relative p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group cursor-pointer">
          <Bell className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background animate-pulse" />
        </button>
      </div>
    </header>
  );
}
