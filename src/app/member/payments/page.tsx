"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, CalendarDays, ShieldCheck, AlertCircle, Printer, X, CheckCircle2 } from "lucide-react";

interface Member {
  _id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  membershipStatus: "Active" | "Expiring Soon" | "Expired" | "Suspended";
  membershipExpiry: string;
  remainingAmount: number;
  joinDate: string;
  totalFee: number;
  totalPaid: number;
  membershipDuration: number;
}

interface PaymentLog {
  _id: string;
  amount: number;
  date: string;
  invoiceId: string;
  status: "Paid" | "Partially Paid" | "Pending" | "Overdue";
}

export default function MemberPayments() {
  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeInvoice, setActiveInvoice] = useState<PaymentLog | null>(null);

  const fetchPaymentsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile
      const profileRes = await fetch("/api/member/profile");
      const profileData = await profileRes.json();
      if (profileData.success && profileData.data?.member) {
        const m = profileData.data.member;
        setMember(m);

        // 2. Fetch Payments Logs
        const payRes = await fetch(`/api/payments/${m._id}`);
        const payData = await payRes.json();
        if (payData.success) {
          setPayments(payData.data.payments);
        }
      }
    } catch (error) {
      console.error("Failed to load billing details", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  const getProgressPercentage = (joinDateStr?: string, expiryDateStr?: string) => {
    if (!joinDateStr || !expiryDateStr) return 0;
    const start = new Date(joinDateStr).getTime();
    const end = new Date(expiryDateStr).getTime();
    const now = new Date().getTime();
    if (now >= end) return 100;
    if (now <= start) return 0;
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const getDaysRemaining = (expiryDateStr?: string) => {
    if (!expiryDateStr) return 0;
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getPlanName = (months?: number) => {
    if (!months) return "Custom Plan";
    if (months === 1) return "Basic 1-Month Plan";
    if (months === 3) return "Quarterly 3-Month Plan";
    if (months === 6) return "Semi-Annual 6-Month Plan";
    if (months === 12) return "Pro Annual 12-Month Plan";
    return `${months}-Month Plan`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "Expiring Soon":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Suspended":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-red-500/20 text-red-400 border-red-500/30";
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading your billing details...</p>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(member?.membershipExpiry);
  const elapsedPercent = getProgressPercentage(member?.joinDate, member?.membershipExpiry);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Payments & <span className="text-primary text-gradient">Membership</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your billing and membership details.
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="membership">
        {/* Current Membership Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 relative rounded-3xl p-8 overflow-hidden group"
        >
          {/* Card Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 border border-white/10 rounded-3xl" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-colors duration-500" />
          
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="flex justify-between items-start">
              <div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1 w-max mb-4 ${getStatusColor(member?.membershipStatus)}`}>
                  <ShieldCheck className="w-3 h-3" /> {member?.membershipStatus || "Inactive"}
                </span>
                <h2 className="text-3xl font-bold text-white">{getPlanName(member?.membershipDuration)}</h2>
                <p className="text-muted-foreground mt-1">Full access to ON FITNESS STUDIO premium training arenas</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">₹{member?.totalFee.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Contract Value</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div className="bg-black/20 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
                <p className="text-xs text-muted-foreground mb-1">Started On</p>
                <p className="font-bold text-white">
                  {member?.joinDate ? new Date(member.joinDate).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                </p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
                <p className="text-xs text-muted-foreground mb-1">Expires On</p>
                <p className="font-bold text-white">
                  {member?.membershipExpiry ? new Date(member.membershipExpiry).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                </p>
              </div>
            </div>
            
            {/* Progress Bar for time remaining */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>Time Elapsed</span>
                <span>{daysRemaining} Days Left</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full neon-glow transition-all duration-500" 
                  style={{ width: `${elapsedPercent}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Payment Summary */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-center"
        >
          {member && member.remainingAmount <= 0 ? (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground mb-6">
                You have no pending dues. Thank you for your on-time payment!
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mb-6 text-yellow-500">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pending Dues</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Please clear your outstanding balance of ₹{member?.remainingAmount.toLocaleString()} at the reception.
              </p>
            </>
          )}
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-white/5 text-sm">
              <span className="text-muted-foreground">Total Fee</span>
              <span className="font-semibold text-white">₹{member?.totalFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/5 text-sm">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-semibold text-emerald-400">₹{member?.totalPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 text-sm">
              <span className="text-muted-foreground">Outstanding</span>
              <span className={`font-semibold ${member && member.remainingAmount > 0 ? "text-yellow-500" : "text-emerald-400"}`}>
                ₹{member?.remainingAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Payment History */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel rounded-3xl p-6 border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Payment History</h2>
        </div>

        <div className="overflow-x-auto">
          {payments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No transactions logged yet.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <table className="hidden md:table w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Invoice ID</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Amount Paid</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {payments.map((invoice) => (
                    <tr key={invoice._id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="py-4 font-mono font-bold text-white">{invoice.invoiceId}</td>
                      <td className="py-4 text-muted-foreground">
                        {new Date(invoice.date).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-4 font-bold text-primary">₹{invoice.amount.toLocaleString()}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          invoice.status === "Paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => setActiveInvoice(invoice)}
                          className="text-muted-foreground hover:text-primary transition-all p-1.5 rounded bg-white/5 border border-white/10 cursor-pointer"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Stacked Card View */}
              <div className="block md:hidden space-y-4">
                {payments.map((invoice) => (
                  <div key={invoice._id} className="p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-white text-sm">{invoice.invoiceId}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        invoice.status === "Paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="text-white font-medium">
                        {new Date(invoice.date).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-bold text-primary">₹{invoice.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-end pt-2 border-t border-white/5">
                      <button 
                        onClick={() => setActiveInvoice(invoice)}
                        className="text-primary hover:text-primary/80 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                      >
                        <Printer className="w-3.5 h-3.5" /> View Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Invoice Details / Printing Modal */}
      <AnimatePresence>
        {activeInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto no-print">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#0B0F19] border border-white/10 rounded-3xl p-6 sm:p-8 relative my-8"
            >
              <button
                onClick={() => setActiveInvoice(null)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white uppercase tracking-wider">Invoice Details</h3>

                {/* Printable Invoice Container */}
                <div 
                  id="printable-invoice" 
                  className="p-6 rounded-2xl bg-white text-black border border-gray-200 shadow-lg space-y-6 font-sans"
                >
                  <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-black">ON FITNESS STUDIO</h2>
                      <p className="text-xs text-gray-500 font-medium">Ganaur, Haryana (Owner: Sukchain Pahal)</p>
                      <p className="text-[10px] text-gray-400 font-medium">contact@onfitness.com | +91 9017319009</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                        {activeInvoice.status}
                      </span>
                      <p className="text-xs font-mono font-bold mt-2 text-gray-700">{activeInvoice.invoiceId}</p>
                      <p className="text-[10px] text-gray-500">Date: {new Date(activeInvoice.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Billed To</h4>
                    <p className="text-sm font-bold text-black">{member?.fullName || "Gym Member"}</p>
                    <p className="text-xs text-gray-600">Phone: {member?.phoneNumber}</p>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-200 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          <th className="pb-2">Description</th>
                          <th className="pb-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-xs text-gray-800">
                          <td className="py-3 font-semibold">Membership Renewal / Dues Payment</td>
                          <td className="py-3 text-right font-bold">₹ {activeInvoice.amount.toLocaleString()}</td>
                        </tr>
                        <tr className="border-t border-gray-100 text-xs text-gray-800 font-medium">
                          <td className="py-3 text-gray-500">Total Plan Value:</td>
                          <td className="py-3 text-right">₹ {member?.totalFee?.toLocaleString() || "0"}</td>
                        </tr>
                        <tr className="text-xs text-gray-800 font-medium">
                          <td className="py-1 text-gray-500">Total Paid to Date:</td>
                          <td className="py-1 text-right text-emerald-600 font-bold">₹ {member?.totalPaid?.toLocaleString() || "0"}</td>
                        </tr>
                        <tr className="text-xs text-gray-800 font-bold border-t border-gray-200 pt-2">
                          <td className="py-3 text-gray-900">Remaining Balance:</td>
                          <td className="py-3 text-right text-yellow-600">₹ {member?.remainingAmount?.toLocaleString() || "0"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-gray-200 pt-4 text-center">
                    <p className="text-[10px] text-gray-400 font-semibold italic">Thank you for training with ON FITNESS STUDIO!</p>
                    <p className="text-[8px] text-gray-400 mt-1">This is an electronically generated receipt. No signature is required.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveInvoice(null)}
                    className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl transition-colors cursor-pointer text-sm"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.print();
                      }
                    }}
                    className="flex-1 py-3 bg-primary hover:bg-primary/90 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(0,255,178,0.2)] transition-colors cursor-pointer text-sm flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print Receipt
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 40px !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}} />
    </div>
  );
}
