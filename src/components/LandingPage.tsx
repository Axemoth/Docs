"use client";

import React, { useRef } from "react";

interface User {
  id: string;
  username: string;
  email: string;
}

interface LandingPageProps {
  users: User[];
  onLogin: (userId: string) => void;
}

export default function LandingPage({ users, onLogin }: LandingPageProps) {
  const loginSectionRef = useRef<HTMLDivElement>(null);

  const scrollToLogin = () => {
    loginSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Get avatar colors dynamically based on username
  const getAvatarGradient = (username: string) => {
    switch (username) {
      case "rushil":
        return "from-purple-500 to-indigo-600 shadow-purple-500/20";
      case "yash":
        return "from-amber-500 to-orange-600 shadow-orange-500/20";
      case "aditya":
        return "from-teal-500 to-emerald-600 shadow-emerald-500/20";
      default:
        return "from-blue-500 to-indigo-600 shadow-blue-500/20";
    }
  };

  return (
    <div className="space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center space-y-8 pt-8 max-w-4xl mx-auto animate-fade-in">
        {/* Glow Effects in Dark Mode */}
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none dark:block hidden"></div>
        <div className="absolute top-0 -right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none dark:block hidden"></div>

        <div className="space-y-4">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 uppercase tracking-wider select-none">
            Introducing Axe Docs v1.0
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight axe-text-title">
            The Future of Collaborative <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
              Writing & Publishing
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl axe-text-muted leading-relaxed">
            Axe Docs combines rich-text formatting, granular access sharing permissions (viewer vs. editor), and local or cloud database persistence into a single unified workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={scrollToLogin}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            Get Started
          </button>
          <a
            href="#features"
            className="px-6 py-3.5 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-2xl text-sm font-bold transition-all"
          >
            Learn More
          </a>
        </div>

        {/* Live Mockup */}
        <div className="w-full pt-8 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent z-10 h-full pointer-events-none"></div>
          <div className="axe-card border rounded-3xl overflow-hidden shadow-2xl p-4 md:p-6 w-full max-w-3xl mx-auto opacity-95">
            {/* Window control circles */}
            <div className="flex gap-1.5 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
              <span className="w-3 h-3 bg-red-400 rounded-full"></span>
              <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
              <span className="w-3 h-3 bg-green-400 rounded-full"></span>
            </div>
            {/* Editor mockup visual */}
            <div className="pt-4 text-left space-y-4">
              <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-900 rounded-md"></div>
              <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-900 rounded-md"></div>
              <div className="pl-6 space-y-2 pt-2">
                <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-900 rounded-md"></div>
                <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-900 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="space-y-12 max-w-5xl mx-auto scroll-mt-24">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold axe-text-title">Packed with Essential Features</h2>
          <p className="text-sm axe-text-muted max-w-md mx-auto">
            Axe Docs delivers the core editing and sharing capabilities you need, without bloat.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Feature 1 */}
          <div className="axe-card border p-6 rounded-2xl flex gap-4">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold axe-text-title text-sm">Rich-Text Editor</h4>
              <p className="text-xs axe-text-muted leading-relaxed">
                Format text instantly with Bold, Italic, Underline, custom H1/H2 Headings, and bulleted or numbered lists.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="axe-card border p-6 rounded-2xl flex gap-4">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742L12 12l3.316-1.258M14.158 11.7L12 12.88 9.842 11.7M12 21a9.003 9.003 0 008.367-5.633L12 19l-8.367-3.633A9.003 9.003 0 0012 21z" />
              </svg>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold axe-text-title text-sm">Granular Access Control</h4>
              <p className="text-xs axe-text-muted leading-relaxed">
                Add permissions dynamically for view-only (Read-Only) or edit (Editor) mode, secure backend checks prevent illegal saves.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="axe-card border p-6 rounded-2xl flex gap-4">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold axe-text-title text-sm">Seamless File Imports</h4>
              <p className="text-xs axe-text-muted leading-relaxed">
                Import offline drafts in `.txt` or `.md` format from the dashboard or append notes in the editor canvas using simple uploads.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="axe-card border p-6 rounded-2xl flex gap-4">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold axe-text-title text-sm">Dual Database Drivers</h4>
              <p className="text-xs axe-text-muted leading-relaxed">
                Frictionless zero-setup SQLite locally for developers, and production-grade PostgreSQL in the cloud (Neon DB).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Login Portal Section */}
      <section
        ref={loginSectionRef}
        className="max-w-md mx-auto p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-xl space-y-6 scroll-mt-24 animate-fade-in"
      >
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold axe-text-title">Access your Workspace</h3>
          <p className="text-xs axe-text-muted leading-normal px-2">
            Select one of our pre-configured evaluation accounts to sign in immediately and start editing documents.
          </p>
        </div>

        <div className="space-y-3">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onLogin(user.id)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/25 border border-slate-100 dark:border-slate-800/50 hover:border-blue-400 dark:hover:border-blue-700/60 rounded-2xl transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                {/* Avatar Icon */}
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(
                    user.username
                  )} text-white flex items-center justify-center font-bold text-sm uppercase shadow-md select-none`}
                >
                  {user.username.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-850 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-450 transition-colors text-sm capitalize">
                    {user.username}
                  </span>
                  <span className="text-3xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {user.email}
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 bg-slate-200/50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-blue-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
