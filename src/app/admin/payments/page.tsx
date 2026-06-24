"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, IndianRupee, Clock, ArrowUpRight, ArrowDownRight, Wallet, ReceiptText, Search, Plus, CheckCircle2, AlertCircle, X, Printer } from "lucide-react";

interface PaymentLog {
  _id: string;
  memberId: {
    _id: string;
    fullName: string;
    phoneNumber: string;
    profileImage?: string;
    totalFee?: number;
    totalPaid?: number;
    remainingAmount?: number;
  };
  amount: number;
  date: string;
  invoiceId: string;
  status: "Paid" | "Partially Paid" | "Pending" | "Overdue";
}

interface MemberSearchResult {
  _id: string;
  fullName: string;
  phoneNumber: string;
  remainingAmount: number;
  totalFee: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Financial Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingDues, setPendingDues] = useState(0);
  const [todayCollection, setTodayCollection] = useState(0);

  // Collect Payment Form States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("UPI");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeInvoice, setActiveInvoice] = useState<PaymentLog | null>(null);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments?limit=30");
      const data = await res.json();
      if (data.success) {
        setPayments(data.data.payments);
        
        // Compute today's collection from today's transactions
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        let todaySum = 0;
        data.data.payments.forEach((p: PaymentLog) => {
          const pDate = new Date(p.date);
          if (pDate >= startOfToday) {
            todaySum += p.amount;
          }
        });
        setTodayCollection(todaySum);
      }
    } catch (error) {
      console.error("Failed to load payments history", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/analytics/dashboard");
      const data = await res.json();
      if (data.success && data.data.statistics) {
        setTotalRevenue(data.data.statistics.totalRevenue);
        setPendingDues(data.data.statistics.pendingDues);
      }
    } catch (error) {
      console.error("Failed to load stats", error);
    }
  };

  const handleSearch = async () => {
    setSearching(true);
    try {
      const res = await fetch(`/api/members?search=${searchQuery}&limit=5`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data.members);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error("Failed to search members", error);
    } finally {
      setSearching(false);
    }
  };

  const selectMember = (m: MemberSearchResult) => {
    setSelectedMember(m);
    setPayAmount("");
    setSearchQuery(m.fullName);
    setShowSearchResults(false);
    setErrorMsg("");
  };

  const handleCollectPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      setErrorMsg("Please search and select a member first.");
      return;
    }
    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg("Please enter a valid payment amount.");
      return;
    }
    if (amountNum > selectedMember.remainingAmount) {
      setErrorMsg(`Amount cannot exceed the member's dues of ₹${selectedMember.remainingAmount.toLocaleString()}`);
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember._id,
          amount: amountNum,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to record payment");
      }

      alert(`Successfully collected ₹${amountNum.toLocaleString()}!`);
      
      // Clear form
      setSelectedMember(null);
      setPayAmount("");
      setSearchQuery("");
      
      // Refresh grids and summaries
      fetchPayments();
      fetchStats();
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to submit transaction");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-2xl border border-primary/20 bg-primary/5 relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 rounded-xl bg-primary/20">
              <IndianRupee className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue Collected</p>
              <h3 className="text-2xl font-extrabold text-white">₹ {totalRevenue.toLocaleString()}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-primary relative z-10">
            <ArrowUpRight className="w-4 h-4" />
            <span>Total money collected from members</span>
          </div>
        </motion.div>
 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 rounded-xl bg-yellow-500/20">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Amount</p>
              <h3 className="text-2xl font-extrabold text-white">₹ {pendingDues.toLocaleString()}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-yellow-500 relative z-10">
            <AlertCircle className="w-4 h-4" />
            <span>Amount yet to be collected</span>
          </div>
        </motion.div>
 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6 rounded-2xl border border-secondary/20 bg-secondary/5 relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl" />
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 rounded-xl bg-secondary/20">
              <Wallet className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Collection</p>
              <h3 className="text-2xl font-extrabold text-white">₹ {todayCollection.toLocaleString()}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground relative z-10">
            <span>Total money collected today</span>
          </div>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment History Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-panel rounded-2xl border border-white/10 flex flex-col overflow-hidden h-[520px]"
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-muted-foreground">Loading database transactions...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 gap-3">
                <IndianRupee className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No financial transactions recorded yet.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <table className="hidden md:table w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Member Name & Phone</th>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Amount Paid</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {payments.map((p) => (
                      <tr key={p._id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4">
                          <p className="text-sm font-bold text-white">{p.memberId?.fullName || "Gym Member"}</p>
                          <p className="text-xs text-muted-foreground">{p.memberId?.phoneNumber || "N/A"}</p>
                        </td>
                        <td className="py-4 text-xs text-muted-foreground">
                          {new Date(p.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-4 font-bold text-primary">
                          ₹ {p.amount.toLocaleString()}
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => setActiveInvoice(p)}
                            title="Print Receipt"
                            className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Stacked Card View */}
                <div className="block md:hidden space-y-4">
                  {payments.map((p) => (
                    <div key={p._id} className="p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-white">{p.memberId?.fullName || "Gym Member"}</p>
                          <p className="text-xs text-muted-foreground">{p.memberId?.phoneNumber || "N/A"}</p>
                        </div>
                        <button
                          onClick={() => setActiveInvoice(p)}
                          title="Print Receipt"
                          className="p-2 rounded bg-white/5 border border-white/10 hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="text-white">
                          {new Date(p.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Amount Paid:</span>
                        <span className="font-bold text-primary">₹ {p.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Quick Payment Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col relative z-20"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-primary" />
              Collect Payment
            </h3>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-3 text-xs font-medium mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCollectPaymentSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Member Search input */}
              <div className="relative">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Search Gym Member</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                  />
                  {selectedMember && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMember(null);
                        setSearchQuery("");
                        setPayAmount("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown Results */}
                <AnimatePresence>
                  {showSearchResults && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-0 mt-1 bg-[#0B0F19] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-30 divide-y divide-white/5 max-h-48 overflow-y-auto"
                    >
                      {searchResults.map((m) => (
                        <button
                          key={m._id}
                          type="button"
                          onClick={() => selectMember(m)}
                          className="w-full p-3 hover:bg-white/5 flex items-center justify-between gap-2 text-left"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-white truncate">{m.fullName}</p>
                            <p className="text-xs text-muted-foreground">{m.phoneNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-yellow-500 font-bold">Dues: ₹{m.remainingAmount.toLocaleString()}</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dynamic Member Details */}
              {selectedMember && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Membership Fee:</span>
                    <span className="text-white font-semibold">₹{selectedMember.totalFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Already Paid:</span>
                    <span className="text-primary font-semibold">₹{(selectedMember.totalFee - selectedMember.remainingAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-white/10 pt-2">
                    <span className="text-white">Remaining Amount:</span>
                    <span className="text-yellow-500 font-semibold">₹{selectedMember.remainingAmount.toLocaleString()}</span>
                  </div>
                  {payAmount && !isNaN(parseFloat(payAmount)) && parseFloat(payAmount) > 0 && (
                    <div className="border-t border-dashed border-white/10 pt-2 space-y-1 bg-primary/5 -mx-4 px-4 py-2 mt-2">
                      <div className="flex justify-between text-xs font-bold text-primary">
                        <span>New Total Paid:</span>
                        <span>₹{((selectedMember.totalFee - selectedMember.remainingAmount) + parseFloat(payAmount)).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-emerald-400">
                        <span>New Remaining:</span>
                        <span>₹{Math.max(0, selectedMember.remainingAmount - parseFloat(payAmount)).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Amount Received */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">New Amount Received (₹)</label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    required
                    placeholder="Enter amount received..."
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 text-base font-bold"
                  />
                </div>
              </div>

              {/* Method Selection */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod("UPI")}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                      payMethod === "UPI" ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-white/5 text-muted-foreground hover:text-white"
                    }`}
                  >
                    UPI / Online
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("Cash")}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                      payMethod === "Cash" ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-white/5 text-muted-foreground hover:text-white"
                    }`}
                  >
                    Cash Payment
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6">
              <button
                type="submit"
                disabled={submitting || !selectedMember}
                className="w-full flex justify-center items-center gap-2 py-3.5 rounded-xl bg-primary text-black font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-[0_0_15px_rgba(0,255,178,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Plus className="w-4 h-4" /> {submitting ? "Processing..." : "Record Transaction"}
              </button>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                Outstanding dues will be dynamically updated in MongoDB.
              </p>
            </div>
          </form>
        </motion.div>
      </div>

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
                    <p className="text-sm font-bold text-black">{activeInvoice.memberId?.fullName || "Gym Member"}</p>
                    <p className="text-xs text-gray-600">Phone: {activeInvoice.memberId?.phoneNumber}</p>
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
                          <td className="py-3 text-right">₹ {activeInvoice.memberId?.totalFee?.toLocaleString() || "0"}</td>
                        </tr>
                        <tr className="text-xs text-gray-800 font-medium">
                          <td className="py-1 text-gray-500">Total Paid to Date:</td>
                          <td className="py-1 text-right text-emerald-600 font-bold">₹ {activeInvoice.memberId?.totalPaid?.toLocaleString() || "0"}</td>
                        </tr>
                        <tr className="text-xs text-gray-800 font-bold border-t border-gray-200 pt-2">
                          <td className="py-3 text-gray-900">Remaining Balance:</td>
                          <td className="py-3 text-right text-yellow-600">₹ {activeInvoice.memberId?.remainingAmount?.toLocaleString() || "0"}</td>
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
