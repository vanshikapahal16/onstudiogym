"use client";

import { Clock, Phone, MapPin } from "lucide-react";

export default function TopInfoBar() {
  return (
    <div className="bg-black/90 text-gray-300 py-2 px-4 text-xs md:text-sm border-b border-[#c39b62]/20 hidden md:block">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#c39b62]" />
            <span><span className="text-white font-medium">Gym:</span> 5:00 AM - 10:00 PM</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#c39b62]" />
            <span><span className="text-white font-medium">Ladies:</span> 10 AM - 12 PM | 2 PM - 4 PM</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <a href="tel:8400050073" className="flex items-center gap-2 hover:text-white transition-colors group">
            <Phone className="w-4 h-4 text-[#c39b62] group-hover:scale-110 transition-transform" />
            <span>8400050073 / 9017319009</span>
          </a>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#c39b62]" />
            <span>Khubru Road, Near Shiv Garden, Ganaur</span>
          </div>
        </div>
      </div>
    </div>
  );
}
