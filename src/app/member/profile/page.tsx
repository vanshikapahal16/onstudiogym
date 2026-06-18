"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, User, Phone, MapPin, Mail, ShieldCheck, Save } from "lucide-react";

export default function MemberProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    profileImage: "",
    membershipPlan: "Monthly",
    membershipStatus: "Pending",
    createdAt: "",
  });

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/member/profile");
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile({
          name: data.data.member.name || "",
          email: data.data.member.email || "",
          phone: data.data.member.phone || "",
          address: data.data.member.address || "",
          profileImage: data.data.member.profileImage || "",
          membershipPlan: data.data.member.membershipPlan || "Monthly",
          membershipStatus: data.data.member.membershipStatus || "Pending",
          createdAt: data.data.member.createdAt || "",
        });
      } else {
        alert(data.message || "Failed to load profile");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch("/api/member/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          profileImage: profile.profileImage,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsEditing(false);
        alert("Profile updated successfully");
      } else {
        alert(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("An error occurred while updating profile");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
            <div 
              className="relative group cursor-pointer"
              onClick={() => {
                if (isEditing) {
                  document.getElementById("profile-image-input")?.click();
                }
              }}
            >
              <input
                id="profile-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                disabled={!isEditing}
              />
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-secondary p-1 group-hover:neon-glow transition-all duration-300">
                <div className="w-full h-full bg-background rounded-full overflow-hidden border-2 border-background relative">
                  <img 
                    src={profile.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || "Member")}&background=random`} 
                    alt={profile.name} 
                    className="w-full h-full object-cover" 
                  />
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
              <p className="text-primary text-sm font-medium mb-2">{profile.membershipPlan} Member</p>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border inline-flex items-center gap-1 ${
                profile.membershipStatus === "Active" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                profile.membershipStatus === "Expiring Soon" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                "bg-red-500/20 text-red-400 border-red-500/30"
              }`}>
                <ShieldCheck className="w-3 h-3" /> {profile.membershipStatus} Since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : "N/A"}
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
                  className="text-sm px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors border border-white/10 cursor-pointer"
                >
                  Edit Profile
                </button>
              ) : (
                <button 
                  onClick={handleSave}
                  className="text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(var(--primary),0.5)] cursor-pointer"
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
                <label className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3"/> Email Address</label>
                <input 
                  type="email" 
                  value={profile.email} 
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                  disabled={!isEditing}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
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
