"use client";

import { useState, useEffect } from "react";
import { Check, X, Clock, AlertCircle } from "lucide-react";

interface Request {
  _id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  status: string;
  createdAt: string;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [passkeyModal, setPasskeyModal] = useState<{ isOpen: boolean; passkey: string | null; name: string | null }>({
    isOpen: false,
    passkey: null,
    name: null,
  });

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/requests");
      const data = await res.json();
      if (data.success) {
        setRequests(data.data.requests);
      }
    } catch (error) {
      console.error("Failed to fetch requests", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to approve ${name}'s request?`)) return;

    try {
      const res = await fetch(`/api/admin/requests/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setPasskeyModal({ isOpen: true, passkey: data.data.passkey, name });
        fetchRequests(); // Refresh the list
      } else {
        alert(data.message || "Failed to approve request");
      }
    } catch (error) {
      console.error("Failed to approve", error);
      alert("An error occurred");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wider">
            Sign Up <span className="text-primary">Requests</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and approve pending member sign-ups.
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/10 text-gray-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Contact Info</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No sign-up requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{req.fullName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white">{req.phoneNumber}</p>
                      <p className="text-gray-400 text-xs">{req.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          req.status === "Approved"
                            ? "bg-green-500/10 text-green-500 border border-green-500/20"
                            : req.status === "Rejected"
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                        }`}
                      >
                        {req.status === "Approved" && <Check className="w-3 h-3" />}
                        {req.status === "Pending" && <Clock className="w-3 h-3" />}
                        {req.status === "Rejected" && <X className="w-3 h-3" />}
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === "Pending" && (
                        <button
                          onClick={() => handleApprove(req._id, req.fullName)}
                          className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors font-medium border border-primary/20 text-sm inline-flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Passkey Modal */}
      {passkeyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setPasskeyModal({ isOpen: false, passkey: null, name: null })}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Request Approved</h3>
                <p className="text-sm text-gray-400 mt-2">
                  {passkeyModal.name} has been added as a member. Share this 4-digit passkey with them so they can log in.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl w-full flex justify-center">
                <span className="text-4xl font-black text-primary tracking-widest">{passkeyModal.passkey}</span>
              </div>
              <button 
                onClick={() => setPasskeyModal({ isOpen: false, passkey: null, name: null })}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
