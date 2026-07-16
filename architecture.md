# Architecture Note — Axe Docs

Axe Docs is a lightweight, high-performance collaborative document editor designed to run seamlessly in local dev, in containers (Docker), and in serverless production environments (Vercel + Neon Postgres).

---

## 1. Technology Stack Decisions

We prioritized **portability**, **simplicity**, and **compatibility** across systems:

1. **Framework: Next.js (App Router, React 19, TypeScript)**
   * **Why:** Next.js provides a unified full-stack model. It combines frontend React rendering and serverless API endpoints (`/api/...`) under a single codebase with zero CORS setup, and deploys instantly to Vercel.

2. **Database: Dual-Driver Manager (SQLite + PostgreSQL)**
   * **Local Driver (SQLite via native `node:sqlite`):** Native Windows compilation of SQLite packages (like `better-sqlite3`) frequently fails if Visual Studio build tools are missing. Since Node v22.5.0, Node has a built-in, pre-compiled `node:sqlite` module — giving a **100% compile-free local setup**.
   * **Production Driver (PostgreSQL via `pg`):** Serverless platforms like Vercel are stateless. If `process.env.DATABASE_URL` is defined, the database manager automatically swaps drivers to persistent Neon Postgres.

3. **Frontend Styling: Tailwind CSS v4**
   * Used for clean, premium styling — slate color palette, glassmorphism headers, realistic paper dropshadows, and responsive grids.

---

## 2. Technical System Design

### A. The Database Wrapper (`src/lib/db.ts`)
A unified abstraction layer exposes Promise-based `query` / `execute` interfaces that work identically on both SQLite and Postgres. A regex-based translator converts SQLite's `?` placeholders to Postgres `$1, $2, ...` at runtime:

```typescript
let index = 1;
const pgSql = sql.replace(/\?/g, () => `$${index++}`);
```

All rows are passed through a `toCamelCase` mapper so API responses use consistent camelCase field names regardless of which database is active.

### B. Auto-Migrations & Seeding
On first startup the database manager creates three tables:
1. `users`: Stores user credentials (`id`, `username`, `email`).
2. `documents`: Stores document records (`id`, `title`, `content` [sanitized HTML], `owner_id`, `created_at`, `updated_at`).
3. `shares`: Manages access permissions (`id`, `document_id`, `user_id`, `access_level` — `'read'` | `'write'`).

If the `users` table is empty, three mock accounts are seeded automatically — no manual SQL needed.

### C. Rich-Text Editor & Debounced Autosave (`src/components/Editor.tsx`)
Older React editor packages (like React-Quill) have peer dependency conflicts with React 19. We built a custom editor using a standard `contentEditable` div.
* **Toolbar Actions:** Buttons trigger browser-native `document.execCommand` formatting. Clicking a button calls `e.preventDefault()` on `onMouseDown` to prevent the editor from losing focus.
* **Debounced Autosave:** Edits trigger a `1200ms` debounced `PATCH /api/documents/[id]` request. Visual states cycle through `Saving…` → `All changes saved` → `Offline – Save failed`.
* **File Imports:** `.txt`, `.md`, and `.docx` (Word) files can be imported from both the dashboard and inside the editor. For `.docx` files, [Mammoth.js](https://github.com/mwilliamson/mammoth.js) is dynamically imported and converts Word XML into clean HTML — the resulting HTML is stored directly without re-escaping, so formatting (bold, lists, headings) renders correctly in the editor.

### D. Sharing & Permission Layer
* **Mock Auth:** Authentication is simulated via a dropdown in the header, saving the selected user ID to `localStorage`. Every API request sends this ID in the `X-User-Id` header.
* **Server-side Access Control:** All mutating API routes call `getDocumentAccess(docId, userId)` before executing SQL. This function checks ownership and the `shares` table, returning `'owner'` | `'write'` | `'read'` | `null`. Read-only users are blocked at the server, not just the UI.
* **Client-side Cache Prevention:** All `fetch` calls to `/api/documents` and `/api/documents/[id]` include `cache: "no-store"` to prevent stale permission data being served when switching demo accounts.

### E. Exports
Documents can be exported as:
* **Markdown (.md):** Strips HTML tags and converts bold/italic/heading markup to Markdown syntax.
* **Word (.doc):** Wraps editor HTML in a Microsoft Office-compatible HTML envelope and triggers a download.
* **PDF (.pdf):** Opens a print dialog with a dedicated print stylesheet that suppresses navigation chrome.

---

## 3. Prioritized Architectural Decisions

1. **PORTABILITY FIRST:** Rejected native-compiled SQLite packages to guarantee that any reviewer on Windows can `npm install && npm run dev` without errors.
2. **SECURITY LOCKS:** Backend-level enforcement. A viewer cannot edit a document by altering client-side code — the PATCH handler validates access in the database before any SQL update runs.
3. **USER EXPERIENCE:** Integrated direct file uploads in both dashboard and open-editor contexts. Debounced autosave means users never need to remember to save.
