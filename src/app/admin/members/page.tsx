"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Trash2,
  Edit2,
  Clock,
  UserCheck,
  RefreshCw,
  Key,
  Ban,
} from "lucide-react";

interface Member {
  _id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  address: string;
  joinDate: string;
  membershipDuration: number;
  membershipExpiry: string;
  totalFee: number;
  totalPaid: number;
  remainingAmount: number;
  membershipStatus: "Active" | "Expiring Soon" | "Expired" | "Suspended" | "Pending";
  profileImage?: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, pages: 1, total: 0 });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [membershipDuration, setMembershipDuration] = useState("3");
  const [totalFee, setTotalFee] = useState("");
  const [totalPaid, setTotalPaid] = useState("0");
  const [payAmount, setPayAmount] = useState("");

  // Renewal states
  const [renewMonths, setRenewMonths] = useState("3");
  const [renewFee, setRenewFee] = useState("");
  const [renewPaid, setRenewPaid] = useState("");

  // Profile image (base64) & Manual status override
  const [profileImage, setProfileImage] = useState("");
  const [membershipStatus, setMembershipStatus] = useState<"Active" | "Expiring Soon" | "Expired" | "Suspended" | "Pending">("Active");

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // New features states
  const [customPassword, setCustomPassword] = useState("");
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Approval states
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveEmail, setApproveEmail] = useState("");
  const [approvePasskey, setApprovePasskey] = useState("");
  const [approveMonths, setApproveMonths] = useState("1");
  const [approveFee, setApproveFee] = useState("1000");
  const [approvePaid, setApprovePaid] = useState("1000");

  // URL status filter detection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const statusParam = params.get("status");
      if (statusParam) {
        setStatusFilter(statusParam);
      }
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [searchQuery, statusFilter, pagination.page]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const url = `/api/members?page=${pagination.page}&limit=${pagination.limit}&search=${searchQuery}&status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMembers(data.data.members);
        setPagination((prev) => ({
          ...prev,
          pages: data.data.pagination.pages,
          total: data.data.pagination.total,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch members", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const planName = membershipDuration === "1" ? "Monthly" : membershipDuration === "3" ? "Quarterly" : membershipDuration === "6" ? "Half-Yearly" : "Annual";
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phoneNumber,
          email: email || undefined,
          address,
          membershipPlan: planName,
          membershipDuration: parseInt(membershipDuration),
          totalFee: parseFloat(totalFee),
          totalPaid: parseFloat(totalPaid),
          profileImage: profileImage || undefined,
          password: customPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create member");
      }

      setTempPassword(data.data.tempPassword || customPassword || "Custom Password Set");
      // Wait for user to dismiss temporary password screen
      fetchMembers();
    } catch (error: any) {
      setFormError(error.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/members/${selectedMember._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phoneNumber,
          email: email || undefined,
          address,
          membershipDuration: parseInt(membershipDuration),
          totalFee: parseFloat(totalFee),
          membershipStatus,
          profileImage: profileImage || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update member");
      }

      setIsEditModalOpen(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (error: any) {
      setFormError(error.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/members/${selectedMember._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renewMonths: parseInt(renewMonths),
          renewFee: parseFloat(renewFee),
          renewPaid: parseFloat(renewPaid || "0"),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to renew member");
      }

      setIsRenewModalOpen(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (error: any) {
      setFormError(error.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember._id,
          amount: parseFloat(payAmount),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to record payment");
      }

      setIsPayModalOpen(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (error: any) {
      setFormError(error.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedMember) return;
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/members/${selectedMember._id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete member");
      }

      setIsDeleteModalOpen(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (error: any) {
      alert(error.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckIn = async (memberId: string) => {
    try {
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Member checked in successfully!");
        fetchMembers();
      } else {
        alert(data.message || "Failed to check in");
      }
    } catch (err: any) {
      alert("Error occurred: " + err.message);
    }
  };

  const handleCheckOut = async (memberId: string) => {
    try {
      const res = await fetch("/api/attendance/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Member checked out successfully!");
        fetchMembers();
      } else {
        alert(data.message || "Failed to check out");
      }
    } catch (err: any) {
      alert("Error occurred: " + err.message);
    }
  };

  const openAddModal = () => {
    setFullName("");
    setPhoneNumber("");
    setEmail("");
    setAddress("");
    setMembershipDuration("3");
    setTotalFee("");
    setTotalPaid("0");
    setProfileImage("");
    setTempPassword("");
    setFormError("");
    setCustomPassword("");
    setIsAddModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setSelectedMember(member);
    setFullName(member.fullName);
    setPhoneNumber(member.phoneNumber);
    setEmail(member.email || "");
    setAddress(member.address);
    setMembershipDuration(member.membershipDuration.toString());
    setTotalFee(member.totalFee.toString());
    setProfileImage(member.profileImage || "");
    setMembershipStatus(member.membershipStatus);
    setFormError("");
    setIsEditModalOpen(true);
    setActiveDropdown(null);
  };

  const openPayModal = (member: Member) => {
    setSelectedMember(member);
    setPayAmount(member.remainingAmount.toString());
    setFormError("");
    setIsPayModalOpen(true);
    setActiveDropdown(null);
  };

  const openRenewModal = (member: Member) => {
    setSelectedMember(member);
    setRenewMonths("3");
    setRenewFee("");
    setRenewPaid("");
    setFormError("");
    setIsRenewModalOpen(true);
    setActiveDropdown(null);
  };

  const openDeleteModal = (member: Member) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
    setActiveDropdown(null);
  };

  const openResetPasswordModal = (member: Member) => {
    setSelectedMember(member);
    setNewPassword("");
    setFormError("");
    setIsResetPasswordModalOpen(true);
    setActiveDropdown(null);
  };

  const openApproveModal = (member: Member) => {
    setSelectedMember(member);
    setApproveEmail(member.email || "");
    setApprovePasskey("");
    setApproveMonths("1");
    setApproveFee("1000");
    setApprovePaid("1000");
    setFormError("");
    setIsApproveModalOpen(true);
    setActiveDropdown(null);
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    if (!/^\d{4}$/.test(approvePasskey)) {
      setFormError("Passcode must be exactly 4 numeric digits.");
      return;
    }

    setFormError("");
    setSubmitting(true);

    try {
      const planName = approveMonths === "1" ? "Monthly" : approveMonths === "3" ? "Quarterly" : approveMonths === "6" ? "Half-Yearly" : "Annual";
      const res = await fetch(`/api/members/${selectedMember._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: approveEmail || undefined,
          password: approvePasskey,
          membershipStatus: "Active",
          membershipPlan: planName,
          membershipDuration: parseInt(approveMonths),
          totalFee: parseFloat(approveFee),
          totalPaid: parseFloat(approvePaid),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to approve member");
      }

      setIsApproveModalOpen(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (error: any) {
      setFormError(error.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/members/${selectedMember._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to reset password");
      }

      alert("Password reset successfully! Force change password flag is active for their next login.");
      setIsResetPasswordModalOpen(false);
      setNewPassword("");
      setSelectedMember(null);
      fetchMembers();
    } catch (error: any) {
      setFormError(error.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSuspend = async (member: Member) => {
    const isCurrentlySuspended = member.membershipStatus === "Suspended";
    const confirmMsg = isCurrentlySuspended 
      ? `Are you sure you want to reactivate ${member.fullName}?` 
      : `Are you sure you want to suspend ${member.fullName}?`;
      
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/members/${member._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: isCurrentlySuspended,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Member ${isCurrentlySuspended ? "reactivated" : "suspended"} successfully!`);
        fetchMembers();
      } else {
        alert(data.message || "Operation failed");
      }
    } catch (err: any) {
      alert("Error occurred: " + err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-primary/10 text-primary border-primary/20";
      case "Expiring Soon":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "Suspended":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "Pending":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-red-500/10 text-red-500 border-red-500/20";
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-1 w-full sm:w-auto gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4.5 h-4.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all glass-panel"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
            >
              <option value="" className="bg-[#0B0F19]">All Status</option>
              <option value="Active" className="bg-[#0B0F19]">Active</option>
              <option value="Expiring Soon" className="bg-[#0B0F19]">Expiring Soon</option>
              <option value="Expired" className="bg-[#0B0F19]">Expired</option>
              <option value="Pending" className="bg-[#0B0F19]">Pending Approvals</option>
            </select>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black hover:bg-primary/95 hover:scale-102 cursor-pointer transition-all text-sm font-bold shadow-[0_0_15px_rgba(0,255,178,0.3)] whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Main Dynamic View */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading members from database...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="flex-1 glass-panel rounded-2xl border border-white/10 p-12 text-center flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground" />
          <h3 className="text-xl font-bold text-white">No members found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Try adjusting your search criteria or register a new member to get started.
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-primary text-black rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            Register First Member
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block glass-panel rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contract Details</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Membership Status</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financial Status</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {members.map((member) => (
                    <tr key={member._id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10 overflow-hidden">
                            {member.profileImage ? (
                              <img src={member.profileImage} alt={member.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-white">{member.fullName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{member.fullName}</p>
                            <p className="text-xs text-muted-foreground">{member.phoneNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {member.membershipStatus === "Pending" ? (
                          <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {member.address}
                          </span>
                        ) : (
                          <>
                            <p className="text-sm text-white">Join: {new Date(member.joinDate).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">Expires: {new Date(member.membershipExpiry).toLocaleDateString()}</p>
                          </>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(member.membershipStatus)}`}>
                          {member.membershipStatus === "Active" ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {member.membershipStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        {member.membershipStatus === "Pending" ? (
                          <span className="text-xs text-muted-foreground italic">Pending Approval</span>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Paid:</span>
                              <span className="text-xs text-primary font-bold">₹{member.totalPaid.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Dues:</span>
                              <span className={`text-xs font-bold ${member.remainingAmount > 0 ? "text-yellow-500" : "text-emerald-500"}`}>
                                ₹{member.remainingAmount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right relative">
                        <div className="flex items-center justify-end gap-2">
                          {member.membershipStatus === "Pending" ? (
                            <>
                              <button
                                onClick={() => openApproveModal(member)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                title="Delete Request"
                                onClick={() => openDeleteModal(member)}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-muted-foreground transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                title="Record Payment"
                                onClick={() => openPayModal(member)}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 text-muted-foreground transition-colors cursor-pointer"
                              >
                                <CreditCard className="w-4 h-4" />
                              </button>
                              <button
                                title="Renew Membership"
                                onClick={() => openRenewModal(member)}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-[#6366F1]/10 hover:text-[#818CF8] hover:border-[#6366F1]/20 text-muted-foreground transition-colors cursor-pointer"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                title="Edit Member"
                                onClick={() => openEditModal(member)}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-primary/10 hover:text-primary hover:border-primary/20 text-muted-foreground transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                title="Reset Password"
                                onClick={() => openResetPasswordModal(member)}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/20 text-muted-foreground transition-colors cursor-pointer"
                              >
                                <Key className="w-4 h-4" />
                              </button>
                              <button
                                title={member.membershipStatus === "Suspended" ? "Reactivate Member" : "Suspend Member"}
                                onClick={() => handleToggleSuspend(member)}
                                className={`p-2 rounded-lg bg-white/5 border border-white/10 text-muted-foreground transition-colors cursor-pointer ${
                                  member.membershipStatus === "Suspended"
                                    ? "hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20"
                                    : "hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                                }`}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                              <button
                                title="Delete Member"
                                onClick={() => openDeleteModal(member)}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-muted-foreground transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              
                              {/* Fast Attendance */}
                              <div className="h-6 w-[1px] bg-white/10 mx-1" />
                              <button
                                onClick={() => handleCheckIn(member._id)}
                                title="Quick Check-In"
                                className="p-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary text-black transition-colors text-xs font-bold cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleCheckOut(member._id)}
                                title="Quick Check-Out"
                                className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500 hover:text-black text-yellow-500 transition-colors text-xs font-bold cursor-pointer"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="block lg:hidden space-y-4">
            {members.map((member) => (
              <motion.div
                key={member._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4 bg-[#0B0F19]/60"
              >
                {/* Member Identity */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10 overflow-hidden">
                    {member.profileImage ? (
                      <img src={member.profileImage} alt={member.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-base font-bold text-white">{member.fullName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-white truncate">{member.fullName}</h4>
                    <p className="text-xs text-muted-foreground">{member.phoneNumber}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(member.membershipStatus)}`}>
                    {member.membershipStatus}
                  </span>
                </div>

                {/* Info Fields Grid */}
                {member.membershipStatus === "Pending" ? (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Prospect Details</span>
                    <span className="text-xs text-white block flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {member.address}</span>
                    <span className="text-xs text-muted-foreground block italic">Pending Signup Request</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Membership</span>
                      <span className="text-xs text-white">Join: {new Date(member.joinDate).toLocaleDateString()}</span>
                      <span className="text-[10px] text-muted-foreground block">Exp: {new Date(member.membershipExpiry).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Financial Dues</span>
                      <span className="text-xs text-primary font-semibold block">Paid: ₹{member.totalPaid.toLocaleString()}</span>
                      <span className={`text-xs font-semibold block ${member.remainingAmount > 0 ? "text-yellow-500" : "text-emerald-500"}`}>
                        Remaining: ₹{member.remainingAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Touch Actions */}
                {member.membershipStatus === "Pending" ? (
                  <div className="flex gap-2 w-full pt-2 border-t border-white/5">
                    <button
                      onClick={() => openApproveModal(member)}
                      className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    >
                      <UserCheck className="w-4 h-4" /> Approve Request
                    </button>
                    <button
                      onClick={() => openDeleteModal(member)}
                      className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-red-500 hover:bg-red-500/10 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleCheckIn(member._id)}
                      className="py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary flex flex-col items-center justify-center text-[10px] font-bold gap-1 active:bg-primary active:text-black transition-all"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Check-In</span>
                    </button>
                    <button
                      onClick={() => handleCheckOut(member._id)}
                      className="py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 flex flex-col items-center justify-center text-[10px] font-bold gap-1 active:bg-yellow-500 active:text-black transition-all"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Check-Out</span>
                    </button>
                    <button
                      onClick={() => openPayModal(member)}
                      className="py-2 rounded-xl bg-white/5 border border-white/10 text-emerald-400 flex flex-col items-center justify-center text-[10px] font-bold gap-1 active:bg-emerald-500/10"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pay</span>
                    </button>
                    <button
                      onClick={() => openRenewModal(member)}
                      className="py-2 rounded-xl bg-white/5 border border-white/10 text-indigo-400 flex flex-col items-center justify-center text-[10px] font-bold gap-1 active:bg-indigo-500/10"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Renew</span>
                    </button>
                    <button
                      onClick={() => openResetPasswordModal(member)}
                      className="py-2 rounded-xl bg-white/5 border border-white/10 text-yellow-400 flex flex-col items-center justify-center text-[10px] font-bold gap-1 active:bg-yellow-500/10"
                    >
                      <Key className="w-4 h-4" />
                      <span>Reset Pass</span>
                    </button>
                    <button
                      onClick={() => handleToggleSuspend(member)}
                      className={`py-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-[10px] font-bold gap-1 transition-all ${
                        member.membershipStatus === "Suspended"
                          ? "text-emerald-400 active:bg-emerald-500/10"
                          : "text-orange-400 active:bg-orange-500/10"
                      }`}
                    >
                      <Ban className="w-4 h-4" />
                      <span>{member.membershipStatus === "Suspended" ? "Activate" : "Suspend"}</span>
                    </button>
                    <button
                      onClick={() => openEditModal(member)}
                      className="py-2 rounded-xl bg-white/5 border border-white/10 text-blue-400 flex flex-col items-center justify-center text-[10px] font-bold gap-1 active:bg-blue-500/10"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => openDeleteModal(member)}
                      className="py-2 rounded-xl bg-white/5 border border-white/10 text-red-400 flex flex-col items-center justify-center text-[10px] font-bold gap-1 active:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-white/10 bg-white/5 rounded-2xl flex items-center justify-between mt-auto">
            <p className="text-xs text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} members
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal - Add Member / Temp Password Success */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-[#0B0F19] border border-white/10 rounded-3xl p-6 sm:p-8 relative my-8"
            >
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {tempPassword ? (
                /* Onboarding Success Screen */
                <div className="text-center space-y-6 py-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,255,178,0.2)]">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Member Onboarded!</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      New membership profile has been logged in MongoDB.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">TEMPORARY PASSWORD</span>
                    <p className="text-2xl font-mono font-black text-primary tracking-wider">{tempPassword}</p>
                    <p className="text-xs text-muted-foreground">
                      Give this to the member. They will be forced to change it on their first login.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setTempPassword("");
                    }}
                    className="w-full py-3 bg-primary text-black font-bold uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    Done & Refresh List
                  </button>
                </div>
              ) : (
                /* Registration Form */
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">Register New Member</h3>
                    <p className="text-sm text-muted-foreground mt-1">Add operational details below to register.</p>
                  </div>

                  {formError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 text-xs font-medium">
                      {formError}
                    </div>
                  )}

                  <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-primary" /> Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Rahul Verma"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-primary" /> Phone Number
                        </label>
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="9876543210"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-primary" /> Email (Optional)
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="member@email.com"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary" /> Duration (Months)
                        </label>
                        <select
                          value={membershipDuration}
                          onChange={(e) => setMembershipDuration(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                        >
                          <option value="1" className="bg-[#0B0F19]">1 Month</option>
                          <option value="3" className="bg-[#0B0F19]">3 Months</option>
                          <option value="6" className="bg-[#0B0F19]">6 Months</option>
                          <option value="12" className="bg-[#0B0F19]">12 Months</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> Address
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="H-15, Sec 62, Noida"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">
                        Profile Photo
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-black hover:file:bg-primary/90 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-primary" /> Custom Password (Optional)
                      </label>
                      <input
                        type="password"
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        placeholder="Leave blank to auto-generate"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-primary" /> Total Fee (₹)
                        </label>
                        <input
                          type="number"
                          required
                          value={totalFee}
                          onChange={(e) => setTotalFee(e.target.value)}
                          placeholder="5000"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-primary" /> Paid Amount (₹)
                        </label>
                        <input
                          type="number"
                          value={totalPaid}
                          onChange={(e) => setTotalPaid(e.target.value)}
                          placeholder="0"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 bg-primary text-black font-bold uppercase tracking-wider rounded-xl hover:bg-primary/95 transition-all shadow-[0_0_20px_rgba(0,255,178,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {submitting ? "Processing..." : "Confirm & Save"}
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal - Edit Member */}
      <AnimatePresence>
        {isEditModalOpen && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-[#0B0F19] border border-white/10 rounded-3xl p-6 sm:p-8 relative"
            >
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider">Edit Member Profile</h3>
                  <p className="text-sm text-muted-foreground mt-1">Modify details for {selectedMember.fullName}</p>
                </div>

                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 text-xs font-medium">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" /> Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-primary" /> Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-primary" /> Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> Duration (Months)
                      </label>
                      <select
                        value={membershipDuration}
                        onChange={(e) => setMembershipDuration(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                      >
                        <option value="1">1 Month</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12">12 Months</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" /> Address
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">
                        Profile Photo
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-black hover:file:bg-primary/90 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">
                        Account Status
                      </label>
                      <select
                        value={membershipStatus}
                        onChange={(e) => setMembershipStatus(e.target.value as any)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                      >
                        <option value="Active" className="bg-[#0B0F19]">Active</option>
                        <option value="Expiring Soon" className="bg-[#0B0F19]">Expiring Soon</option>
                        <option value="Expired" className="bg-[#0B0F19]">Expired</option>
                        <option value="Suspended" className="bg-[#0B0F19]">Suspended</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-primary" /> Total Fee (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={totalFee}
                      onChange={(e) => setTotalFee(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-primary text-black font-bold uppercase tracking-wider rounded-xl hover:bg-primary/95 transition-all shadow-[0_0_20px_rgba(0,255,178,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? "Updating..." : "Save Changes"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal - Record Payment */}
      <AnimatePresence>
        {isPayModalOpen && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#0B0F19] border border-white/10 rounded-3xl p-6 sm:p-8 relative"
            >
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider">Record Dues Payment</h3>
                  <p className="text-sm text-muted-foreground mt-1">Collect remaining dues for {selectedMember.fullName}</p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Contract Value:</span>
                    <span className="text-white font-semibold">₹{selectedMember.totalFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Already Paid:</span>
                    <span className="text-primary font-semibold">₹{selectedMember.totalPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-white/10 pt-2 font-bold">
                    <span className="text-white">Outstanding Dues:</span>
                    <span className="text-yellow-500">₹{selectedMember.remainingAmount.toLocaleString()}</span>
                  </div>
                </div>

                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 text-xs font-medium">
                    {formError}
                  </div>
                )}

                <form onSubmit={handlePaySubmit} className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">
                      Amount to Pay (₹)
                    </label>
                    <input
                      type="number"
                      required
                      max={selectedMember.remainingAmount}
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm font-bold text-center"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-emerald-500 text-black font-bold uppercase tracking-wider rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? "Recording..." : "Record Payment"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal - Renew Membership */}
      <AnimatePresence>
        {isRenewModalOpen && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#0B0F19] border border-white/10 rounded-3xl p-6 sm:p-8 relative"
            >
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider">Renew Membership</h3>
                  <p className="text-sm text-muted-foreground mt-1">Renew contract for {selectedMember.fullName}</p>
                </div>

                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 text-xs font-medium">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleRenewSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">
                      Renewal Duration
                    </label>
                    <select
                      value={renewMonths}
                      onChange={(e) => setRenewMonths(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                    >
                      <option value="1" className="bg-[#0B0F19]">1 Month</option>
                      <option value="3" className="bg-[#0B0F19]">3 Months</option>
                      <option value="6" className="bg-[#0B0F19]">6 Months</option>
                      <option value="12" className="bg-[#0B0F19]">12 Months</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">
                      Renewal Fee (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={renewFee}
                      onChange={(e) => setRenewFee(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">
                      Amount Paid Upfront (₹)
                    </label>
                    <input
                      type="number"
                      value={renewPaid}
                      onChange={(e) => setRenewPaid(e.target.value)}
                      placeholder="e.g. 2000"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-primary text-black font-bold uppercase tracking-wider rounded-xl hover:bg-primary/95 transition-all shadow-[0_0_20px_rgba(0,255,178,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? "Processing..." : "Renew Membership"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal - Delete Confirmation */}
      <AnimatePresence>
        {isDeleteModalOpen && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#0B0F19] border border-white/10 rounded-3xl p-6 text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Delete Membership?</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to permanently delete <strong>{selectedMember.fullName}</strong>? This action will destroy their credentials and billing records from MongoDB.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl transition-colors cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-colors disabled:opacity-50 cursor-pointer text-sm"
                >
                  {submitting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal - Reset Password */}
      <AnimatePresence>
        {isResetPasswordModalOpen && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#0B0F19] border border-white/10 rounded-3xl p-6 sm:p-8 relative"
            >
              <button
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Key className="w-5 h-5 text-primary" /> Reset Password
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set a new password for <strong>{selectedMember.fullName}</strong>.
                  </p>
                </div>

                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 text-xs font-medium">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new secure password"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-primary text-black font-bold uppercase tracking-wider rounded-xl hover:bg-primary/95 transition-all shadow-[0_0_20px_rgba(0,255,178,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? "Resetting..." : "Reset Password"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal - Approve Member Request */}
      <AnimatePresence>
        {isApproveModalOpen && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-[#0B0F19] border border-white/10 rounded-3xl p-6 sm:p-8 relative my-8"
            >
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-primary" /> Approve Signup Request
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Assign a membership plan and 4-digit passkey for <strong>{selectedMember.fullName}</strong>.
                  </p>
                </div>

                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 text-xs font-medium">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleApproveSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={approveEmail}
                      onChange={(e) => setApproveEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block flex items-center gap-1">
                      <Key className="w-3.5 h-3.5" /> 4-Digit Passkey
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      pattern="\d{4}"
                      value={approvePasskey}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, ""); // only digits
                        setApprovePasskey(val);
                      }}
                      placeholder="e.g. 1234"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm font-mono tracking-widest text-center"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Provide this 4-digit numeric passcode to the user so they can log in.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">
                        Membership Plan
                      </label>
                      <select
                        value={approveMonths}
                        onChange={(e) => {
                          const val = e.target.value;
                          setApproveMonths(val);
                          // Auto set default pricing based on duration
                          if (val === "1") {
                            setApproveFee("1000");
                            setApprovePaid("1000");
                          } else if (val === "3") {
                            setApproveFee("2500");
                            setApprovePaid("2500");
                          } else if (val === "6") {
                            setApproveFee("4500");
                            setApprovePaid("4500");
                          } else if (val === "12") {
                            setApproveFee("8000");
                            setApprovePaid("8000");
                          }
                        }}
                        className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm font-semibold"
                      >
                        <option value="1">Monthly (1 Month)</option>
                        <option value="3">Quarterly (3 Months)</option>
                        <option value="6">Half-Yearly (6 Months)</option>
                        <option value="12">Annual (12 Months)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">
                        Total Plan Fee (₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={approveFee}
                        onChange={(e) => setApproveFee(e.target.value)}
                        placeholder="Fee"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">
                      Paid Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={approvePaid}
                      onChange={(e) => setApprovePaid(e.target.value)}
                      placeholder="Amount Paid"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-sm font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-[#10B981] hover:bg-emerald-400 text-black font-bold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                  >
                    {submitting ? "Approving..." : "Approve & Activate"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
