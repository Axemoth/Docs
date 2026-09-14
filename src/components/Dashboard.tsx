"use client";

import React, { useState, useRef } from "react";

interface DocumentItem {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  ownerUsername: string;
  accessLevel: "owner" | "write" | "read";
}

interface DashboardProps {
  documents: DocumentItem[];
  currentUserId: string;
  onOpenDocument: (id: string) => void;
  onCreateDocument: () => void;
  onImportDocument: (title: string, content: string, isHtml?: boolean) => Promise<void>;
  loading: boolean;
}

export default function Dashboard({
  documents,
  currentUserId,
  onOpenDocument,
  onCreateDocument,
  onImportDocument,
  loading,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"all" | "owned" | "shared">("all");
  const [importMessage, setImportMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myDocs = documents.filter((doc) => doc.ownerId === currentUserId);
  const sharedDocs = documents.filter((doc) => doc.ownerId !== currentUserId);

  const filteredDocs =
    activeTab === "owned" ? myDocs : activeTab === "shared" ? sharedDocs : documents;

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown date";
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.name.split(".").pop()?.toLowerCase();
    if (fileType !== "txt" && fileType !== "md" && fileType !== "docx") {
      setImportMessage("Only .txt, .md, and .docx files can be imported.");
      e.target.value = "";
      return;
    }
    if (file.size > 500_000) {
      setImportMessage("Please choose a file smaller than 500 KB.");
      e.target.value = "";
      return;
    }

    // Get file name without extension
    const title = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;

    if (fileType === "docx") {
      try {
        const mammoth = await import("mammoth");
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            const result = await mammoth.convertToHtml({ arrayBuffer });
            const html = result.value;
            void onImportDocument(title, html || "", true);
          } catch {
            setImportMessage("Failed to parse Word document.");
          }
        };
        reader.readAsArrayBuffer(file);
      } catch {
        setImportMessage("Failed to load document parser.");
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        void onImportDocument(title, text || "");
      };
      reader.onerror = () => setImportMessage("The selected file could not be read.");
      reader.readAsText(file);
    }

    // Reset input
    e.target.value = "";
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Quick Start Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold axe-text-muted uppercase tracking-wider">Start a new document</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.md,.docx"
            className="hidden"
          />
          {/* Create Blank Card */}
          <button
            type="button"
            onClick={onCreateDocument}
            className="flex items-center gap-4 p-5 axe-card border hover:border-blue-500 rounded-2xl cursor-pointer text-left group"
          >
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold axe-text-title text-sm">Blank Document</span>
              <span className="text-xs axe-text-muted mt-0.5">Start fresh draft</span>
            </div>
          </button>

          {/* Import File Card */}
          <button
            type="button"
            onClick={handleImportClick}
            className="flex items-center gap-4 p-5 axe-card border hover:border-emerald-500 rounded-2xl cursor-pointer text-left group"
          >
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold axe-text-title text-sm">Import File</span>
              <span className="text-xs axe-text-muted mt-0.5">Upload a .txt, .md, or .docx file</span>
            </div>
          </button>
        </div>
        <p className="text-xs axe-text-muted">Supports plain text, Markdown, and Word (.docx) files up to 500 KB.</p>
        {importMessage && (
          <div role="status" className="text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/25 border border-blue-100 dark:border-blue-900/40 rounded-xl px-3 py-2 flex justify-between gap-3">
            <span>{importMessage}</span>
            <button type="button" onClick={() => setImportMessage("")} className="font-semibold hover:underline" aria-label="Dismiss import message">Dismiss</button>
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl max-w-max transition-colors">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              All Docs ({documents.length})
            </button>
            <button
              onClick={() => setActiveTab("owned")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "owned"
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              My Docs ({myDocs.length})
            </button>
            <button
              onClick={() => setActiveTab("shared")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "shared"
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Shared ({sharedDocs.length})
            </button>
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-500 dark:text-slate-400 text-sm">Loading documents...</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-20 text-center axe-card border rounded-2xl space-y-3">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="font-semibold axe-text-title text-sm">No Documents Found</h4>
            <p className="text-xs axe-text-muted max-w-xs mx-auto">
              {activeTab === "owned"
                ? "You haven't created any documents yet. Start fresh or import a file!"
                : activeTab === "shared"
                ? "No one has shared any documents with you yet."
                : "Your workspace is empty. Create a document or import a file to start editing."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => {
              const isOwner = doc.ownerId === currentUserId;

              return (
                <button
                  type="button"
                  key={doc.id}
                  onClick={() => onOpenDocument(doc.id)}
                  className="flex flex-col justify-between p-5 axe-card border hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl cursor-pointer group text-left focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  aria-label={`Open ${doc.title}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {/* Document Icon */}
                      <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>

                      {/* Access Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider ${
                          doc.accessLevel === "owner"
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50"
                            : doc.accessLevel === "write"
                            ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50"
                            : "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50"
                        }`}
                      >
                        {doc.accessLevel === "owner" ? "Owner" : doc.accessLevel === "write" ? "Editor" : "Viewer"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-semibold axe-text-title group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm line-clamp-1">
                        {doc.title}
                      </h4>
                      <p className="text-3xs axe-text-muted">
                        Last modified: {formatDate(doc.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4">
                    <div className="flex items-center gap-1.5">
                      {/* Avatar */}
                      <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 rounded-full flex items-center justify-center text-3xs font-bold uppercase">
                        {doc.ownerUsername.charAt(0)}
                      </div>
                      <span className="text-3xs axe-text-muted">
                        {isOwner ? "You" : doc.ownerUsername}
                      </span>
                    </div>

                    {/* Shared Info */}
                    <span className="text-3xs axe-text-muted">
                      {isOwner ? "Private" : "Shared with me"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
