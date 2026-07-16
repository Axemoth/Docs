"use client";

import React, { useState, useEffect } from "react";
import Dashboard from "@/components/Dashboard";
import Editor from "@/components/Editor";
import LandingPage from "@/components/LandingPage";

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
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 1. Load users and theme preference
  useEffect(() => {
    // Theme initialization
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.body.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.body.classList.remove("dark");
    }

    async function loadInitialData() {
      try {
        setLoading(true);
        // Fetch all seeded users
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const usersList: User[] = await res.json();
        setUsers(usersList);

        // Retrieve persisted user session (do NOT auto-login to Alice if missing, showing landing page instead)
        const storedUserId = localStorage.getItem("current_user_id");
        const initialUser = usersList.find((u) => u.id === storedUserId) || null;

        if (initialUser) {
          setCurrentUser(initialUser);
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
    } else {
      setDocuments([]);
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

  // 3. Theme toggle function
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // 4. Session functions
  const handleLogin = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("current_user_id", user.id);
      setView("dashboard");
      setActiveDocId(null);
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem("current_user_id");
    setView("dashboard");
    setActiveDocId(null);
  };

  // 5. Create blank document handler
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

  // 6. Import document handler
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
    fetchDocuments(); // Refresh list to get changes
  };

  // Return a spinner during the initial app load state
  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 gap-3">
        <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Axe Docs loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* App Header */}
      <header className="sticky top-0 z-40 axe-header border-b backdrop-blur-md shadow-2xs">
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
            <span className="font-extrabold text-slate-800 dark:text-white text-base tracking-tight transition-colors">
              Axe <span className="text-blue-600 dark:text-blue-455">Docs</span>
            </span>
          </div>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer text-slate-500 dark:text-slate-400"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                // Sun Icon (Dark Mode active)
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                // Moon Icon (Light Mode active)
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Profile, Switcher Dropdown (dropout menu) & Sign Out */}
            {currentUser ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold capitalize text-slate-800 dark:text-slate-200">
                    {currentUser.username}
                  </span>
                  <span className="text-[10px] text-slate-400">{currentUser.email}</span>
                </div>
                {/* Switcher Dropdown */}
                <select
                  value={currentUser.id}
                  onChange={(e) => handleLogin(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-slate-750 dark:text-slate-250 text-xs font-bold focus:outline-hidden focus:border-blue-500 cursor-pointer capitalize transition-all"
                  title="Switch user session"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-950/60 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-650 dark:text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              // Sign In button: Instantly logs in as Rushil
              <button
                onClick={() => handleLogin("user_rushil")}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {!currentUser ? (
          <LandingPage users={users} onLogin={handleLogin} />
        ) : view === "dashboard" ? (
          <Dashboard
            documents={documents}
            currentUserId={currentUser.id}
            onOpenDocument={handleOpenDocument}
            onCreateDocument={handleCreateDocument}
            onImportDocument={handleImportDocument}
            loading={loading && documents.length === 0}
          />
        ) : (
          activeDocId && (
            <Editor
              documentId={activeDocId}
              currentUserId={currentUser.id}
              onBack={handleBackToDashboard}
            />
          )
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800/80 py-4 text-center mt-12 transition-colors">
        <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">
          Axe Document Workspace • Built with Next.js, React 19 & Neon Postgres
        </span>
      </footer>
    </div>
  );
}
