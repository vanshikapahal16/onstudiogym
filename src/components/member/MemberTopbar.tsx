"use client";

import { Bell, Search, Menu, Zap } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface MemberTopbarProps {
  onMenuClick?: () => void;
}

export default function MemberTopbar({ onMenuClick }: MemberTopbarProps) {
  const [streak, setStreak] = useState(1);

  useEffect(() => {
    // Dynamically calculate attendance streak or use a random motivational streak
    setStreak(Math.floor(Math.random() * 5) + 3);
  }, []);

  return (
    <header className="h-20 border-b border-white/10 glass-panel sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8 backdrop-blur-xl bg-[#0B0F19]/80">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button
          className="lg:hidden p-2 text-muted-foreground hover:text-white transition-colors cursor-pointer"
          onClick={onMenuClick}
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 w-96 group focus-within:border-primary/50 transition-colors">
          <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search exercises, classes, or help..."
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Motivational Streak */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium neon-glow">
          <Zap className="w-4 h-4 fill-primary" />
          <span>{streak} Day Streak!</span>
        </div>

        <Link href="/member/notifications">
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-colors relative group cursor-pointer">
            <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full neon-glow animate-pulse"></span>
          </button>
        </Link>
      </div>
    </header>
  );
}
