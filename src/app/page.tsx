"use client";

import React, { useState, useEffect } from "react";
import Dashboard from "@/components/Dashboard";
import Editor from "@/components/Editor";

interface User {
  id: string;
  username: string;
  email: string;
}

interface DocumentItem {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  ownerUsername: string;
  accessLevel: "owner" | "write" | "read";
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [view, setView] = useState<"dashboard" | "editor">("dashboard");
  const [loading, setLoading] = useState(true);

  // 1. Load users list and set current active user
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        // Fetch all seeded users
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const usersList: User[] = await res.json();
        setUsers(usersList);

        // Retrieve persisted user or default to Alice
        const storedUserId = localStorage.getItem("current_user_id");
        const initialUser =
          usersList.find((u) => u.id === storedUserId) ||
          usersList.find((u) => u.id === "user_alice") ||
          usersList[0];

        if (initialUser) {
          setCurrentUser(initialUser);
          localStorage.setItem("current_user_id", initialUser.id);
        }
      } catch (err) {
        console.error("Initial load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // 2. Reload documents list whenever current user changes
  useEffect(() => {
    if (currentUser) {
      fetchDocuments();
    }
  }, [currentUser]);

  const fetchDocuments = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await fetch("/api/documents", {
        headers: {
          "x-user-id": currentUser.id,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch documents");
      const docs = await res.json();
      setDocuments(docs);
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  // 3. User Switcher Handler
  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const user = users.find((u) => u.id === selectedId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("current_user_id", user.id);
      // Reset view back to dashboard to avoid access clashes on switch
      setView("dashboard");
      setActiveDocId(null);
    }
  };

  // 4. Create blank document handler
  const handleCreateDocument = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "x-user-id": currentUser.id,
        },
      });

      if (!res.ok) throw new Error("Failed to create document");
      const newDoc = await res.json();

      // Refresh document list and open the new document in the editor
      await fetchDocuments();
      setActiveDocId(newDoc.id);
      setView("editor");
    } catch (err: any) {
      alert(err.message || "Failed to create document");
    } finally {
      setLoading(false);
    }
  };

  // 5. Import document handler
  const handleImportDocument = async (title: string, text: string) => {
    if (!currentUser) return;
    try {
      setLoading(true);

      // Create new draft document
      const createRes = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "x-user-id": currentUser.id,
        },
      });

      if (!createRes.ok) throw new Error("Import failed: Couldn't create draft");
      const draftDoc = await createRes.json();

      // Convert plain text into HTML paragraphs
      const htmlContent = text
        .split("\n\n")
        .map((para) => `<p>${para.replace(/\n/g, "<br/>")}</p>`)
        .join("");

      // Update draft with file name and parsed HTML body
      const updateRes = await fetch(`/api/documents/${draftDoc.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({
          title,
          content: htmlContent,
        }),
      });

      if (!updateRes.ok) throw new Error("Import failed: Couldn't write contents");

      // Reload list and open the editor
      await fetchDocuments();
      setActiveDocId(draftDoc.id);
      setView("editor");
    } catch (err: any) {
      alert(err.message || "Failed to import file");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDocument = (id: string) => {
    setActiveDocId(id);
    setView("editor");
  };

  const handleBackToDashboard = () => {
    setView("dashboard");
    setActiveDocId(null);
    fetchDocuments(); // Refresh to catch updates
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* App Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="font-extrabold text-slate-800 text-base tracking-tight">
              Ajaia <span className="text-blue-600">Docs</span>
            </span>
          </div>

          {/* User Switcher controls (Mock Auth) */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            {currentUser && (
              <div className="w-7 h-7 bg-blue-150 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-3xs select-none">
                {currentUser.username.charAt(0)}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">Logged in as</span>
              <select
                value={currentUser?.id || ""}
                onChange={handleUserChange}
                disabled={users.length === 0}
                className="bg-transparent border-0 text-slate-700 font-bold text-xs focus:outline-hidden focus:ring-0 p-0 cursor-pointer pr-4"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {view === "dashboard" ? (
          <Dashboard
            documents={documents}
            currentUserId={currentUser?.id || ""}
            onOpenDocument={handleOpenDocument}
            onCreateDocument={handleCreateDocument}
            onImportDocument={handleImportDocument}
            loading={loading && documents.length === 0}
          />
        ) : (
          activeDocId && (
            <Editor
              documentId={activeDocId}
              currentUserId={currentUser?.id || ""}
              onBack={handleBackToDashboard}
            />
          )
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 text-center mt-12">
        <span className="text-slate-400 text-xs font-medium">
          Ajaia Document Workspace • Built with Next.js, React 19 & SQLite
        </span>
      </footer>
    </div>
  );
}
