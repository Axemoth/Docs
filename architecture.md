# Architecture Note - Axe Docs

Axe Docs is a lightweight, high-performance collaborative document editor designed to run seamlessly in local dev, in containers (Docker), and in serverless production environments (Vercel + Neon Postgres).

---

## 1. Technology Stack Decisions

We prioritized **portability**, **simplicity**, and **compatibility** across systems:

1. **Framework: Next.js (App Router, React 19, TypeScript)**
   * **Why:** Next.js provides a unified full-stack model. It combines frontend React rendering and serverless API endpoints (`/api/...`) under a single codebase. It is the modern standard for React, has zero CORS setup issues when served under a single port, and deploys instantly to Vercel.
2. **Database: Dual-Driver Manager (SQLite + PostgreSQL)**
   * **Local Driver (SQLite via native `node:sqlite`):** Native Windows compilation of SQLite packages (like `better-sqlite3` or `sqlite3`) frequently fails if Visual Studio build tools are missing. Since Node v22.5.0, Node has a built-in, pre-compiled `node:sqlite` module. We leveraged this to ensure a **100% compile-free local setup** for reviewers.
   * **Production Driver (PostgreSQL via `pg`):** Serverless platforms like Vercel are stateless, meaning a local SQLite file is read-only or gets wiped on every restart. We integrated PostgreSQL support. If `process.env.DATABASE_URL` is defined, the database manager automatically swaps drivers, allowing persistent database hosting in the cloud.
3. **Frontend Styling: Tailwind CSS v4**
   * **Why:** We used Tailwind CSS v4 for clean, premium styling. The UI utilizes a modern workspace aesthetic (slate colors, realistic paper dropshadows, glassmorphism headers, responsive grids, and clean badges) with zero heavy CSS libraries.

---

## 2. Technical System Designs

### A. The Database Wrapper (`src/lib/db.ts`)
We wrote a unified abstraction layer that exposes Promise-based query/execution interfaces. To allow writing standard SQL queries that run identically on both SQLite and PostgreSQL, we implemented a regex-based translator:
* SQLite uses standard `?` positional parameters.
* Postgres uses `$1`, `$2`, `$3` positional parameters.
* When in Postgres mode, our wrapper automatically intercepts queries and converts `?` to sequential `$1`, `$2` placeholders at runtime:
  ```typescript
  let index = 1;
  const pgSql = sql.replace(/\?/g, () => `$${index++}`);
  ```

### B. Auto-Migrations & Seeding
To eliminate the need for manual database setup, the database manager automatically executes a multi-statement schema migration script upon initial startup. It verifies the existence of three tables:
1. `users`: Stores user credentials (`id`, `username`, `email`).
2. `documents`: Stores document records (`id`, `title`, `content` [HTML], `owner_id`, `created_at`, `updated_at`).
3. `shares`: Manages access permissions (`id`, `document_id`, `user_id`, `access_level` ['read' | 'write']).

If the `users` table is empty, it automatically seeds three mock accounts:
* **Rushil** (`user_rushil` / `rushil.gorasia@gmail.com`)
* **Yash** (`user_yash` / `yash@example.com`)
* **Aditya** (`user_aditya` / `aditya@example.com`)

### C. Rich-Text Editor & Debounced Autosave
Older React editor packages (like React-Quill) have peer dependency conflicts with React 19. We bypassed this by building a custom editor using a standard `contentEditable` div.
* **Toolbar Actions:** Toolbar buttons trigger browser-native `document.execCommand` formatting. To prevent the editor from losing focus when clicking a toolbar button, we intercept `onMouseDown` and call `e.preventDefault()`.
* **Debounced Autosave:** Edits to the document title or body content trigger a `1200ms` debounced `PATCH /api/documents/[id]` request. If the user stops typing for 1.2 seconds, changes are written to the database, updating the visual saving state (`Saving...` -> `All changes saved`).

### D. Sharing & Permission Layer
* **Mock Auth:** Authentication is simulated via a dropdown in the header, saving the selected user ID to `localStorage`. Every API request sends this ID in the `X-User-Id` header.
* **Access Control:** All API routes verify document access by checking:
  1. Ownership: If `owner_id === x-user-id`, the user is granted `owner` permissions (full read, write, delete, and share rights).
  2. Shares table: If a share record exists, they receive either `write` (view and edit, but no share/delete) or `read` (view-only) permissions.
  3. Denials: If no ownership or share record exists, the API returns a `403 Forbidden` error.

---

## 3. Prioritized Architectural Decisions

1. **PORTABILITY FIRST:** We rejected the use of local-only SQLite packages (which require C++ build tools) to guarantee that any reviewer running Windows can compile the project immediately.
2. **SECURITY LOCKS:** We prioritized backend-level security. Yash cannot edit Rushil's read-only document by altering client-side code, because the `/api/documents/[id]` PATCH handler validates Yash's access level in the database before executing SQL updates.
3. **USER EXPERIENCE:** We integrated direct file uploads into the dashboard and editor toolbars, enabling users to parse `.txt` and `.md` files via `FileReader` and immediately merge them into active drafts.
