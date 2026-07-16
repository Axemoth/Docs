# Axe Docs — Submission

## Links

- **Live application:** ADD_YOUR_VERCEL_URL_HERE
- **Walkthrough video:** See `walkthrough-video.txt`
- **GitHub repository:** https://github.com/Axemoth/Docs

## Candidate

- **Name:** Rushil Gorasia
- **Email:** rushil.gorasia@gmail.com
- **Resume:** https://drive.google.com/file/d/11j88sp_y3gRS-YRbAvfP1e2IC4Qs1Dpd/view?usp=sharing

---

## Project Overview

Axe Docs is a lightweight collaborative document editor built as a focused Google Docs-inspired product slice. It supports document creation, rich-text editing, debounced autosave, `.txt` / `.md` / `.docx` file import, Markdown / Word / PDF export, sharing with viewer/editor permissions, and persistent cloud storage.

**Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, SQLite (local), PostgreSQL/Neon (production), Docker.

---

## Reviewer Quick Start

1. Open the live application URL above.
2. Click **Sign In** or choose a seeded demo account from the landing screen.
3. Create a document or import a `.txt`, `.md`, or `.docx` file.
4. As **Rushil**, click **Share** and share the document with `yash` as **Can View**.
5. Switch to **Yash** using the account dropdown in the header.
6. Confirm Yash sees the document in **Read-Only** mode — editing is disabled.
7. Switch back to **Rushil** and elevate Yash to **Can Edit**.
8. Switch to **Yash** again and confirm editing is now enabled.

### Seeded Demo Accounts

| Account | Username | Email |
|---|---|---|
| Owner | `rushil` | `rushil.gorasia@gmail.com` |
| Collaborator | `yash` | `yash@example.com` |
| Collaborator | `aditya` | `aditya@example.com` |

> No password required — account selection is a demo mechanism for making sharing flows reviewable without external credentials.

---

## What Is Included

### Features
- Create, rename, edit, reopen, and delete owned documents
- Rich-text toolbar: Bold, Italic, Underline, H1, H2, Paragraph, Ordered & Unordered Lists, Clear Formatting
- Debounced autosave with `Saving…` / `All changes saved` / `Offline – Save failed` states
- Import `.txt`, `.md`, and `.docx` (Word) files — from dashboard and inside editor
- Export documents as Markdown (`.md`), Word (`.doc`), and PDF
- Owner / Editor / Viewer sharing model with server-side enforcement
- Read-only editor mode for viewers (toolbar disabled, content non-editable)
- SQLite for local development, PostgreSQL for production (auto-detected via `DATABASE_URL`)
- Input validation and sanitized stored HTML
- Docker configuration for containerized deployment
- Dark mode / Light mode toggle
- Animated landing page with live interactive mini-editor demo

### Files in This Folder
- `README.md` — Local setup, Docker, and Vercel deployment instructions
- `architecture.md` — Implementation decisions, system design, and tradeoffs
- `ai_workflow.md` — AI tools used, bugs found and fixed, verification approach
- `SUBMISSION.md` — This file
- `walkthrough-video.txt` — Walkthrough video URL
- `src/` — Full application source code (App Router, API routes, components, DB layer, tests)
- `Dockerfile` + `docker-compose.yml` — Container configuration
- `package.json` — Scripts and dependencies

---

## Verification Completed

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ No type errors |
| `npm run lint` | ✅ No lint errors |
| `npm test` | ✅ 10/10 assertions passing |
| `npm run build` | ✅ Compiled successfully |
| Manual browser testing | ✅ All flows verified |

---

## Intentional Scope Cuts

- No real-time cursors or presence indicators (would require WebSockets)
- No version history or comments
- No production authentication (mock switching is intentional for demo reviewability)

With another 2–4 hours I would add document version history, optimistic concurrency for simultaneous edits, and real JWT-based authentication.
