"use client";

import React, { useState, useEffect } from "react";

interface Share {
  id: string;
  userId: string;
  accessLevel: "read" | "write";
  username: string;
  email: string;
}

interface ShareModalProps {
  documentId: string;
  documentTitle: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export default function ShareModal({
  documentId,
  documentTitle,
  isOpen,
  onClose,
  currentUserId,
}: ShareModalProps) {
  const [shares, setShares] = useState<Share[]>([]);
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [accessLevel, setAccessLevel] = useState<"read" | "write">("read");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchShares();
      setError("");
      setSuccess("");
      setUsernameOrEmail("");
    }
  }, [isOpen, documentId]);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents/${documentId}/shares`, {
        headers: {
          "x-user-id": currentUserId,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch document shares");
      }

      const data = await res.json();
      setShares(data);
    } catch (err: any) {
      console.error(err);
      setError("Could not load sharing settings");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim()) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`/api/documents/${documentId}/shares`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUserId,
        },
        body: JSON.stringify({
          usernameOrEmail: usernameOrEmail.trim(),
          accessLevel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to share document");
      }

      setSuccess(`Successfully shared with ${data.share.username}`);
      setUsernameOrEmail("");
      fetchShares(); // Refresh share list
    } catch (err: any) {
      setError(err.message || "Failed to share document");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShare = async (targetUserId: string) => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`/api/documents/${documentId}/shares?userId=${targetUserId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": currentUserId,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke access");
      }

      setSuccess("Access revoked successfully");
      fetchShares(); // Refresh share list
    } catch (err: any) {
      setError(err.message || "Failed to revoke access");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-lg truncate pr-4">
            Share "{documentTitle}"
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200/50 rounded-md"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Share Form */}
          <form onSubmit={handleShare} className="space-y-3">
            <label className="block text-sm font-medium text-slate-600">
              Share with another user (e.g. bob, charlie)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="Enter username or email..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 text-sm"
                required
              />
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as "read" | "write")}
                className="px-2 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm focus:outline-hidden focus:border-blue-500"
              >
                <option value="read">Can View</option>
                <option value="write">Can Edit</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Share
              </button>
            </div>
          </form>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-100 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-100 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}

          {/* Shares list */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">People with access</h4>
            {loading && shares.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading settings...</div>
            ) : shares.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                This document is private (not shared with anyone yet)
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
                {shares.map((share) => (
                  <div key={share.id} className="px-4 py-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {share.username}
                      </span>
                      <span className="text-xs text-slate-400 truncate">
                        {share.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-2xs font-semibold uppercase tracking-wider ${
                          share.accessLevel === "write"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-teal-50 text-teal-700 border border-teal-100"
                        }`}
                      >
                        {share.accessLevel === "write" ? "Editor" : "Viewer"}
                      </span>
                      <button
                        onClick={() => handleRevokeShare(share.userId)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded-md cursor-pointer"
                        title="Revoke access"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
