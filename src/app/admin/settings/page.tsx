"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Settings2, 
  BellRing, 
  Shield, 
  User, 
  Building, 
  CreditCard, 
  Users, 
  Trash2, 
  ShieldAlert 
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Gym Details");
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  
  // Add Admin Form State
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("admin");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/admin/profile");
      const data = await res.json();
      if (data.success) {
        setCurrentAdmin(data.data.admin);
        if (data.data.admin.role === "superadmin") {
          fetchAdmins();
        }
      }
    } catch (err) {
      console.error("Failed to fetch admin profile", err);
    }
  };

  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const res = await fetch("/api/admin/management");
      const data = await res.json();
      if (data.success) {
        setAdmins(data.data.admins);
      }
    } catch (err) {
      console.error("Failed to load admin accounts", err);
    } finally {
      setAdminsLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAdminName,
          email: newAdminEmail || undefined,
          phone: newAdminPhone,
          password: newAdminPassword,
          role: newAdminRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create administrator");
      }

      setFormSuccess("Administrator created successfully!");
      setNewAdminName("");
      setNewAdminPhone("");
      setNewAdminEmail("");
      setNewAdminPassword("");
      setNewAdminRole("admin");
      fetchAdmins();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Are you sure you want to delete this administrator account?")) {
      return;
    }
    setDeleteError("");

    try {
      const res = await fetch(`/api/admin/management?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete administrator");
      }

      fetchAdmins();
    } catch (err: any) {
      setDeleteError(err.message || "An unexpected error occurred");
    }
  };

  const handleDemoteAdmin = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to demote administrator ${name} to a regular member?`)) {
      return;
    }
    setDeleteError("");

    try {
      const res = await fetch("/api/admin/management", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "demote",
          id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to demote administrator");
      }

      alert(`Successfully demoted ${name} to Member!`);
      fetchAdmins();
    } catch (err: any) {
      setDeleteError(err.message || "An unexpected error occurred");
    }
  };

  const tabs = [
    { name: "Gym Details", icon: Building },
    ...(currentAdmin?.role === "superadmin" ? [{ name: "Manage Admins", icon: Users }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="space-y-2">
          {tabs.map((item, i) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={i}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,255,178,0.1)]"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
                {item.name}
              </button>
            );
          })}
        </div>

        {/* Settings Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-3 space-y-6"
        >
          {activeTab === "Gym Details" && (
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">Gym Information</h3>
                
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Gym Name</label>
                      <input type="text" defaultValue="ON FITNESS STUDIO" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Contact Phone</label>
                      <input type="text" defaultValue="8400050073 / 9017319009" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Address</label>
                      <textarea rows={3} defaultValue="Khubru Road, Near Shiv Garden, Ganaur" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/10">
                    <button type="button" className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(0,255,178,0.3)]">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">Dynamic Pricing Automation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  The platform currently uses the Simplified Smart Member Data System. You can enter any custom fee amount during member registration, and the system will automatically handle tracking and partial payments.
                </p>
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-primary mb-1">Smart Tracking Active</h4>
                    <p className="text-xs text-primary/80">
                      Partial payments, dues calculation, and expiry tracking are fully automated and running in real-time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Manage Admins" && currentAdmin?.role === "superadmin" && (
            <div className="space-y-6">
              {/* Add Admin Form */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">Create New Administrator</h3>
                <form onSubmit={handleAddAdmin} className="space-y-4">
                  {formError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-3 text-xs font-semibold">
                      {formError}
                    </div>
                  )}
                  {formSuccess && (
                    <div className="bg-primary/10 border border-primary/30 text-primary rounded-xl p-3 text-xs font-semibold">
                      {formSuccess}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name</label>
                      <input 
                        type="text" 
                        required 
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" 
                        placeholder="e.g. Sukchain Pahal"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone Number (Login ID)</label>
                      <input 
                        type="text" 
                        required 
                        value={newAdminPhone}
                        onChange={(e) => setNewAdminPhone(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" 
                        placeholder="10-digit number"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email Address (Optional)</label>
                      <input 
                        type="email" 
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" 
                        placeholder="e.g. name@example.com"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
                      <input 
                        type="password" 
                        required 
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" 
                        placeholder="Minimum 6 characters"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role</label>
                      <select 
                        value={newAdminRole}
                        onChange={(e) => setNewAdminRole(e.target.value)}
                        className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                      >
                        <option value="admin">Administrator (Standard)</option>
                        <option value="superadmin">Super Administrator (Owner)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(0,255,178,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Creating..." : "Create Account"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Admin Registry Table */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">Administrator Registry</h3>
                
                {deleteError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-3 text-xs font-semibold mb-4">
                    {deleteError}
                  </div>
                )}

                {adminsLoading ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">Loading registry...</div>
                ) : admins.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">No administrator records found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-muted-foreground">
                      <thead>
                        <tr className="border-b border-white/5 text-xs text-white uppercase tracking-wider">
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Phone</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Created</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {admins.map((admin) => {
                          const isPrimaryOwner = admin.phone === "9588715527";
                          const isSelf = currentAdmin?._id === admin._id || currentAdmin?.id === admin._id;
                          return (
                            <tr key={admin._id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-4 font-semibold text-white">{admin.name}</td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  admin.role === "superadmin" 
                                    ? "bg-primary/10 text-primary border border-primary/20" 
                                    : "bg-white/10 text-white border border-white/10"
                                }`}>
                                  {admin.role}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-white/80 font-mono">{admin.phone}</td>
                              <td className="py-3 px-4 truncate max-w-[150px]">{admin.email || <span className="text-gray-500 italic text-[11px]">None</span>}</td>
                              <td className="py-3 px-4 text-xs">{new Date(admin.createdAt).toLocaleDateString()}</td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleDemoteAdmin(admin._id, admin.name)}
                                  disabled={isPrimaryOwner || isSelf}
                                  className="p-2 rounded-lg text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-30 disabled:cursor-not-allowed hover:text-yellow-300 transition-colors mr-1"
                                  title={isPrimaryOwner ? "Primary owner cannot be demoted" : isSelf ? "You cannot demote yourself" : "Demote to Member"}
                                >
                                  <ShieldAlert className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAdmin(admin._id)}
                                  disabled={isPrimaryOwner || isSelf}
                                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed hover:text-red-300 transition-colors"
                                  title={isPrimaryOwner ? "Primary owner cannot be deleted" : isSelf ? "You cannot delete yourself" : "Delete administrator"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}


        </motion.div>
      </div>
    </div>
  );
}
