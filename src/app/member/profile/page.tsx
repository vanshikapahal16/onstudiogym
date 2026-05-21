"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, User, Phone, MapPin, Mail, ShieldCheck, Save } from "lucide-react";

export default function MemberProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 234 567 890",
    address: "123 Fitness Ave, Gym City, CA 90210",
  });

  const handleSave = () => {
    setIsEditing(false);
    // Add logic to save changes
  };

  return (
    <div className="space-y-8 pb-10 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Your <span className="text-primary text-gradient">Profile</span>
          </h1>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel rounded-3xl p-8 border border-white/10"
      >
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-secondary p-1 group-hover:neon-glow transition-all duration-300">
                <div className="w-full h-full bg-background rounded-full overflow-hidden border-2 border-background relative">
                  <img src="https://ui-avatars.com/api/?name=John+Doe&background=random" alt="John Doe" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">John Doe</h2>
              <p className="text-primary text-sm font-medium mb-2">Pro Member</p>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30 inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Active Since Jan 2026
              </span>
            </div>
          </div>

          <div className="w-px h-full min-h-[200px] bg-white/10 hidden md:block"></div>

          {/* Profile Details Form */}
          <div className="flex-1 w-full space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-white">Personal Information</h3>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-sm px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors border border-white/10"
                >
                  Edit Profile
                </button>
              ) : (
                <button 
                  onClick={handleSave}
                  className="text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3"/> Full Name</label>
                <input 
                  type="text" 
                  value={profile.name} 
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  disabled={!isEditing}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 disabled:opacity-70 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3"/> Email Address (Read Only)</label>
                <input 
                  type="email" 
                  value={profile.email} 
                  disabled
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-gray-400 focus:outline-none cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3"/> Phone Number</label>
                <input 
                  type="text" 
                  value={profile.phone} 
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  disabled={!isEditing}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 disabled:opacity-70 transition-colors"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3"/> Address</label>
                <input 
                  type="text" 
                  value={profile.address} 
                  onChange={(e) => setProfile({...profile, address: e.target.value})}
                  disabled={!isEditing}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 disabled:opacity-70 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
