"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ShareModal from "./ShareModal";

interface DocumentDetail {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  ownerUsername: string;
  accessLevel: "owner" | "write" | "read";
}

interface EditorProps {
  documentId: string;
  currentUserId: string;
  onBack: () => void;
}

export default function Editor({ documentId, currentUserId, onBack }: EditorProps) {
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingStatus, setSavingStatus] = useState<"saved" | "saving" | "error" | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocument = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/documents/${documentId}`, {
        headers: {
          "x-user-id": currentUserId,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load document");
      }

      const data: DocumentDetail = await res.json();
      setDoc(data);
      setTitle(data.title);

      // Populate contentEditable on next tick once ref is available
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = data.content;
        }
      }, 50);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not load document");
    } finally {
      setLoading(false);
    }
  }, [currentUserId, documentId]);

  // Fetch the latest permitted version whenever the active document changes.
  useEffect(() => {
    // The state update happens after the request settles, not during the effect itself.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDocument();
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [fetchDocument]);

  // 2. Trigger autosave when title or editor content changes
  const triggerAutosave = (updatedTitle: string, updatedContent: string) => {
    setSavingStatus("saving");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": currentUserId,
          },
          body: JSON.stringify({
            title: updatedTitle,
            content: updatedContent,
          }),
        });

        if (!res.ok) {
          throw new Error("Save failed");
        }

        setSavingStatus("saved");
      } catch (err) {
        console.error("Autosave error:", err);
        setSavingStatus("error");
      }
    }, 1200); // 1.2-second debounce
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (doc) {
      triggerAutosave(newTitle, editorRef.current?.innerHTML || "");
    }
  };

  const handleEditorInput = () => {
    if (doc) {
      triggerAutosave(title, editorRef.current?.innerHTML || "");
    }
  };

  // 3. Toolbar formatting actions
  const handleFormat = (command: string, value = "") => {
    if (doc?.accessLevel === "read") return;
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const escapeTextForEditor = (text: string) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  // Client-side HTML-to-Markdown exporter
  const exportToMarkdown = () => {
    if (!doc) return;
    const html = editorRef.current?.innerHTML || doc.content;

    const markdown = html
      // Headings
      .replace(/<h1>(.*?)<\/h1>/gi, "# $1\n\n")
      .replace(/<h2>(.*?)<\/h2>/gi, "## $1\n\n")
      // Lists
      .replace(/<ul>([\s\S]*?)<\/ul>/gi, (match, p1) => {
        return p1.replace(/<li>(.*?)<\/li>/gi, "* $1\n") + "\n";
      })
      .replace(/<ol>([\s\S]*?)<\/ol>/gi, (match, p1) => {
        let index = 1;
        return p1.replace(/<li>(.*?)<\/li>/gi, () => `${index++}. $1\n`) + "\n";
      })
      // Paragraphs & Line Breaks
      .replace(/<p>(.*?)<\/p>/gi, "$1\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      // Formatting tags
      .replace(/<b>(.*?)<\/b>/gi, "**$1**")
      .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
      .replace(/<i>(.*?)<\/i>/gi, "*$1*")
      .replace(/<em>(.*?)<\/em>/gi, "*$1*")
      .replace(/<u>(.*?)<\/u>/gi, "_$1_")
      // Remove any leftover HTML tags
      .replace(/<[^>]+>/g, "")
      // Decode HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");

    // Download file
    const blob = new Blob([markdown.trim()], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title || "Untitled Document"}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportDropdownOpen(false);
  };

  // Client-side Word Document exporter (.doc / .docx compatible)
  const exportToDocx = () => {
    if (!doc) return;
    const html = editorRef.current?.innerHTML || doc.content;

    const docHeader = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
          "xmlns:w='urn:schemas-microsoft-com:office:word' " +
          "xmlns='http://www.w3.org/TR/REC-html40'>" +
          "<head><meta charset='utf-8'><title>" + title + "</title>" +
          "<style>" +
          "body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; }" +
          "h1 { font-size: 20pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }" +
          "h2 { font-size: 16pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }" +
          "p { margin-bottom: 8pt; }" +
          "ul, ol { margin-left: 20pt; margin-bottom: 8pt; }" +
          "li { margin-bottom: 4pt; }" +
          "b, strong { font-weight: bold; }" +
          "i, em { font-style: italic; }" +
          "u { text-decoration: underline; }" +
          "</style>" +
          "</head><body>";
    const docFooter = "</body></html>";

    const sourceHtml = docHeader + html + docFooter;

    const blob = new Blob(['\ufeff' + sourceHtml], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title || "Untitled Document"}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportDropdownOpen(false);
  };

  // Client-side PDF exporter (window print media handler)
  const exportToPdf = () => {
    window.print();
    setIsExportDropdownOpen(false);
  };

  // 4. File import handler
  const handleFileImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.name.split(".").pop()?.toLowerCase();
    if (fileType !== "txt" && fileType !== "md" && fileType !== "docx") {
      setNotice("Only .txt, .md, and .docx files can be imported.");
      return;
    }
    if (file.size > 500_000) {
      setNotice("Please import a file smaller than 500 KB.");
      return;
    }

    if (fileType === "docx") {
      try {
        const mammoth = await import("mammoth");
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            const result = await mammoth.convertToHtml({ arrayBuffer });
            const html = result.value;
            if (editorRef.current && html) {
              editorRef.current.insertAdjacentHTML("beforeend", `<br/>${html}`);
              handleEditorInput();
              setNotice(`Imported Word document: ${file.name}. Saved automatically.`);
            }
          } catch (err) {
            setNotice("Failed to parse Word document.");
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        setNotice("Failed to load document parser.");
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;

        // Convert newlines to paragraphs/breaks for editor formatting
        const formattedHtml = text
          .split("\n\n")
          .map((para) => `<p>${escapeTextForEditor(para).replace(/\n/g, "<br/>")}</p>`)
          .join("");

        if (editorRef.current) {
          // Append at the end of the document
          editorRef.current.insertAdjacentHTML("beforeend", `<br/>${formattedHtml}`);
          handleEditorInput();
          setNotice(`Imported ${file.name}. Changes will save automatically.`);
        }
      };
      reader.readAsText(file);
    }

    // Clear file input value
    e.target.value = "";
  };

  // 5. Delete document handler
  const handleDeleteDoc = async () => {
    if (!confirm("Are you sure you want to permanently delete this document?")) return;

    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": currentUserId,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete document");
      }

      onBack();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Failed to delete document");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Opening document...</span>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 axe-card border rounded-2xl shadow-sm text-center space-y-4 animate-fade-in">
        <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="font-semibold axe-text-title text-lg">Document Unavailable</h3>
        <p className="text-sm axe-text-muted">{error || "This document could not be loaded."}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 axe-btn-secondary border border-transparent dark:border-slate-800 rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isReadOnly = doc.accessLevel === "read";

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Editor Navbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl transition-all cursor-pointer"
            title="Back to Documents"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex flex-col">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              disabled={isReadOnly}
              className="font-bold axe-text-title text-xl bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:outline-hidden px-1 py-0.5 rounded-sm transition-all max-w-sm"
              placeholder="Enter document title..."
            />
            <div className="flex items-center gap-1.5 px-1 mt-0.5">
              <span className="text-2xs axe-text-muted">
                Owned by <span className="font-semibold axe-text-main">{doc.ownerUsername}</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
              {savingStatus === "saving" && (
                <span className="text-2xs text-blue-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                  Saving changes...
                </span>
              )}
              {savingStatus === "saved" && (
                <span className="text-2xs text-emerald-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  All changes saved
                </span>
              )}
              {savingStatus === "error" && (
                <span className="text-2xs text-red-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Offline - Save failed
                </span>
              )}
              {!savingStatus && <span className="text-2xs axe-text-muted">Synced</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          {/* File input for import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.md,.docx"
            className="hidden"
          />

          {/* Export Dropdown Selector */}
          <div className="relative">
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
              title="Export Document"
            >
              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Export</span>
              <svg className="w-3 h-3 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                <button
                  onClick={exportToMarkdown}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold cursor-pointer transition-colors"
                >
                  Export as Markdown (.md)
                </button>
                <button
                  onClick={exportToDocx}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold cursor-pointer transition-colors"
                >
                  Export as Word (.doc)
                </button>
                <button
                  onClick={exportToPdf}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold cursor-pointer transition-colors"
                >
                  Export as PDF (.pdf)
                </button>
              </div>
            )}
          </div>

          {doc.accessLevel === "owner" && (
            <>
              <button
                onClick={() => setIsShareOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                Share
              </button>
              <button
                onClick={handleDeleteDoc}
                className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-950/60 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-650 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                title="Delete document"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}

          {doc.accessLevel === "write" && (
            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs font-semibold uppercase tracking-wider">
              Can Edit
            </span>
          )}

          {isReadOnly && (
            <span className="px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-900/50 rounded-lg text-xs font-semibold uppercase tracking-wider">
              Read Only
            </span>
          )}
        </div>
      </div>

      {/* Read Only Locked Warning */}
      {isReadOnly && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/25 text-amber-800 dark:text-amber-300 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 text-sm flex items-center gap-2.5 shadow-2xs">
          <svg className="w-5 h-5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">
            Read-only mode. You can view this document, but edits are disabled.
          </span>
        </div>
      )}

      {notice && (
        <div role="status" className="p-3 bg-blue-50 dark:bg-blue-950/25 text-blue-800 dark:text-blue-300 rounded-xl border border-blue-200/60 dark:border-blue-900/40 text-sm flex items-center justify-between gap-3">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="text-xs font-semibold hover:underline" aria-label="Dismiss message">Dismiss</button>
        </div>
      )}

      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 axe-card border rounded-2xl">
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleFormat("bold");
          }}
          disabled={isReadOnly}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg font-bold transition-colors cursor-pointer w-9 h-9 flex items-center justify-center"
          title="Bold"
          aria-label="Bold"
        >
          B
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleFormat("italic");
          }}
          disabled={isReadOnly}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg italic transition-colors cursor-pointer w-9 h-9 flex items-center justify-center"
          title="Italic"
          aria-label="Italic"
        >
          I
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleFormat("underline");
          }}
          disabled={isReadOnly}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg underline transition-colors cursor-pointer w-9 h-9 flex items-center justify-center"
          title="Underline"
          aria-label="Underline"
        >
          U
        </button>

        <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1"></span>

        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleFormat("removeFormat");
          }}
          disabled={isReadOnly}
          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          title="Clear formatting"
          aria-label="Clear formatting"
        >
          Clear
        </button>

        <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1"></span>

        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleFormat("formatBlock", "<h1>");
          }}
          disabled={isReadOnly}
          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          title="Heading 1"
          aria-label="Heading 1"
        >
          H1
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleFormat("formatBlock", "<h2>");
          }}
          disabled={isReadOnly}
          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          title="Heading 2"
          aria-label="Heading 2"
        >
          H2
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleFormat("formatBlock", "<p>");
          }}
          disabled={isReadOnly}
          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          title="Normal Paragraph"
          aria-label="Normal paragraph"
        >
          Text
        </button>

        <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1"></span>

        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleFormat("insertUnorderedList");
          }}
          disabled={isReadOnly}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg transition-colors cursor-pointer w-9 h-9 flex items-center justify-center"
          title="Bullet List"
          aria-label="Bulleted list"
        >
          • List
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleFormat("insertOrderedList");
          }}
          disabled={isReadOnly}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg transition-colors cursor-pointer w-9 h-9 flex items-center justify-center"
          title="Numbered List"
          aria-label="Numbered list"
        >
          1. List
        </button>

        <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1"></span>

        <button
          onClick={handleFileImportClick}
          disabled={isReadOnly}
          className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Import text/markdown file into current draft"
          aria-label="Import text or markdown file"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import File
        </button>
      </div>

      <div className="axe-editor-workspace border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 md:p-12 overflow-x-auto min-h-[900px] flex justify-center">
        <div className="w-full max-w-3xl axe-editor-paper border min-h-[850px] p-12 md:p-16 rounded-xs select-text">
          <div
            ref={editorRef}
            contentEditable={!isReadOnly}
            onInput={handleEditorInput}
            className="editor-content"
            data-placeholder="Start typing your document..."
            style={{ userSelect: "text", WebkitUserSelect: "text" }}
          ></div>
        </div>
      </div>

      {/* Sharing modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        documentId={doc.id}
        documentTitle={title}
        currentUserId={currentUserId}
      />
    </div>
  );
}
