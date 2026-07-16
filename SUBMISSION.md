# Submission Checklist - Axe Docs

This file contains all the details required for evaluating the Axe Docs collaborative editor assignment.

---

## 1. Candidate Details
* **Full Name:** Rushil Gorasia
* **Email:** Rushil.gorasia@gmail.com
* **Resume Link:** https://drive.google.com/file/d/11j88sp_y3gRS-YRbAvfP1e2IC4Qs1Dpd/view?usp=sharing

---

## 2. Project Overview
* **Project Name:** Axe Docs
* **Description:** A lightweight collaborative document editor inspired by Google Docs, supporting rich-text formatting, mock authentication, document sharing (Read vs. Edit permissions), autosave, and direct text/markdown file imports.
* **Tech Stack:** Next.js (React 19, TypeScript), Tailwind CSS v4, Node.js built-in SQLite (local), PostgreSQL via `pg` (production Neon DB), and Docker.

---

## 3. Databases and Credentials

### A. Live PostgreSQL Database
* **Database Provider:** Neon DB
* **Connection String:** `postgresql://neondb_owner:npg_ZERLejS9umB0@ep-purple-flower-a66deeve-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
* **Status:** Fully migrated and seeded with mock accounts.

### B. Seeded User Credentials (for Switch User)
Select any of these users from the switcher in the header to test sharing:
1. **Rushil** (ID: `user_rushil` / Email: `rushil.gorasia@gmail.com`)
2. **Yash** (ID: `user_yash` / Email: `yash@example.com`)
3. **Aditya** (ID: `user_aditya` / Email: `aditya@example.com`)

---

## 4. Feature Summary & Priorities

### What is Working (100% Functional):
* **Document Management:** Create new blank documents, rename titles, edit content, and delete documents (owners only).
* **Rich-Text Toolbar:** Bold, Italic, Underline, H1, H2, Paragraph formatting, and Bulleted/Numbered lists.
* **Autosave:** Automatically debounce-saves changes to the database 1.2 seconds after typing.
* **Mock Auth & User Switcher:** Change active sessions immediately in the header to view other users' list of owned and shared documents.
* **Sharing Control Modal:** Owners can share documents by username (e.g. `yash`, `aditya`) and grant `Can View` (Read-only) or `Can Edit` (Editor) rights. It prevents owners from sharing with themselves and allows revoking access.
* **Access Control:** The backend API blocks Yash from editing Rushil's document if he is shared as Read-Only. Unauthorized users get an Access Denied (403) screen if they attempt to load the document directly.
* **File Upload & Import:** Upload `.txt` and `.md` files from the Dashboard (creates a new document with the file name and content) or inside the Editor (appends text directly to the active draft).
* **Docker:** Containerized setup maps port 3000 and exposes database environment variables.
* **Automated Integration Tests:** Test suite verifying all 10 endpoints and permission assertions.

### What was Intentionally Deprioritized (Scope Cuts):
* **Real-time Cursor Indicators:** Deprioritized to fit within the 4-hour timebox. Instead, we implemented high-fidelity sharing permissions and view/edit lock states.
* **Version History:** Deprioritized in favor of robust autosaving and file imports.

---

## 5. File Manifest (What's Included)
* [Dockerfile](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/Dockerfile) - Production multi-stage Docker build config
* [docker-compose.yml](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/docker-compose.yml) - Container orchestrator config
* [package.json](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/package.json) - Scripts and dependencies runner
* [tsconfig.json](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/tsconfig.json) - TypeScript compiler config
* [next.config.ts](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/next.config.ts) - Standalone build configurations
* [architecture.md](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/architecture.md) - Architecture design and tradeoffs note
* [ai_workflow.md](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/ai_workflow.md) - AI-native developer workflow note
* [src/lib/db.ts](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/src/lib/db.ts) - SQLite / PostgreSQL database driver connection layer
* [src/lib/permissions.ts](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/src/lib/permissions.ts) - Access control helper functions
* [src/lib/schema.ts](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/src/lib/schema.ts) - TypeScript database typings
* [src/tests/api.test.ts](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/src/tests/api.test.ts) - Automated integration test suite
* [src/app/page.tsx](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/src/app/page.tsx) - Main page controller
* [src/app/globals.css](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/src/app/globals.css) - CSS and styling system
* [src/components/Dashboard.tsx](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/src/components/Dashboard.tsx) - Grid panel dashboard component
* [src/components/Editor.tsx](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/src/components/Editor.tsx) - Canvas-sheet editor component
* [src/components/ShareModal.tsx](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/src/components/ShareModal.tsx) - Modal settings component
* [src/app/api/users/route.ts](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/src/app/api/users/route.ts) - Users router
* [src/app/api/documents/route.ts](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/src/app/api/documents/route.ts) - Document list/create router
* [src/app/api/documents/[id]/route.ts](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/src/app/api/documents/[id]/route.ts) - Document CRUD router
* [src/app/api/documents/[id]/shares/route.ts](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/src/app/api/documents/[id]/shares/route.ts) - Document share permissions router
* [README.md](file:///c:/Users/ASUS/Desktop/Ajaj%20ai%2520assesment/README.md) - Run and setup guide
