"use client";

import { MessageCircle, Phone } from "lucide-react";
import { InstagramIcon as Instagram } from "@/components/icons/InstagramIcon";

export default function FloatingActions() {
  const whatsappMsg = encodeURIComponent("Hello ON FITNESS STUDIO, I want to know more about gym membership.");
  const whatsappUrl = `https://wa.me/918400050073?text=${whatsappMsg}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
      {/* Instagram */}
      <a 
        href="https://instagram.com/on_fitness_studio" 
        target="_blank"
        className="w-14 h-14 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 hover:shadow-pink-500/50 transition-all duration-300"
      >
        <Instagram className="w-6 h-6" />
      </a>
      
      {/* Call */}
      <a 
        href="tel:8400050073" 
        className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 hover:shadow-blue-500/50 transition-all duration-300 md:hidden"
      >
        <Phone className="w-6 h-6" />
      </a>

      {/* WhatsApp */}
      <a 
        href={whatsappUrl} 
        target="_blank"
        className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-110 hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] transition-all duration-300 relative group"
      >
        <MessageCircle className="w-7 h-7" />
        
        {/* Tooltip */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-black/90 backdrop-blur-md text-white text-sm font-bold rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity border border-white/10 hidden md:block">
          Chat with us
        </div>
      </a>
    </div>
  );
}
