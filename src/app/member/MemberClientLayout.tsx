"use client";

import MemberSidebar from "@/components/member/MemberSidebar";
import MemberTopbar from "@/components/member/MemberTopbar";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function MemberClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (pathname === "/member/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0F19] text-white">
      {/* Sidebar with mobile toggle support */}
      <MemberSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Backdrop overlay for mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Main container with responsive left margin */}
      <div className="flex-1 lg:ml-64 flex flex-col h-screen overflow-hidden relative">
        {/* Futuristic Background Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-[40%] left-[60%] w-[20%] h-[20%] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
        
        <MemberTopbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
