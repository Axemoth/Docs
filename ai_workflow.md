# AI-Native Workflow Note — Axe Docs

This note documents how AI tools were leveraged to build, iterate, debug, and verify Axe Docs.

---

## 1. AI Tools Used

* **Antigravity (Google DeepMind):** Leveraged as an autonomous agentic coding assistant to design the full-stack architecture, execute terminal commands, create/edit source files, run automated builds and tests, debug runtime bugs, and write documentation throughout the session.

---

## 2. Where AI Materially Sped Up the Project

1. **Bypassing Workspace Naming Constraints (Bootstrapping)**
   * `create-next-app` refused to initialize inside a directory named `Ajaj ai assesment` (spaces + uppercase). The AI scripted a workaround: initialize the app in a temp subfolder and move the files to the root — resolved in under a minute.

2. **Dual-Driver Database Adapter (`src/lib/db.ts`)**
   * Rather than adopting a heavy ORM (Prisma, Drizzle) which would have required schema files and additional configuration, the AI designed a minimal driver-agnostic SQL wrapper. It detects `DATABASE_URL` at startup, swaps to `pg`, and translates `?` placeholders to `$1`/`$2` using a regex — keeping the codebase lean and portable.

3. **The Rich-Text Focus Trap**
   * Custom `contentEditable` editors lose focus when clicking toolbar buttons, breaking `document.execCommand`. The AI immediately solved this with `onMouseDown={(e) => e.preventDefault()}` on every toolbar button — one line fix.

4. **Mammoth.js Word Document Import**
   * `.docx` files are binary XML. The AI integrated [Mammoth.js](https://github.com/mwilliamson/mammoth.js) via a dynamic `import()` to parse Word documents in the browser without adding it to the server bundle. The parsed HTML is inserted directly into the editor's `contentEditable` div.

5. **Debugging the View-Only Permissions Bug**
   * A subtle bug: switching demo accounts left a stale browser-cached API response for `/api/documents/[id]`. The cached response contained `accessLevel: "owner"` from the previous session, making the UI appear fully editable. The server correctly rejected autosave requests from the viewer, causing a "Save failed" error. The AI identified this by running a live database inspection script, confirmed the server-side data was correct, and fixed it by adding `cache: "no-store"` to all GET fetches — a targeted one-line fix per call site.

6. **Word Import HTML Escaping Bug**
   * After Mammoth parsed a `.docx` file into HTML, `handleImportDocument` was treating the result as plain text and escaping all tags (`<p>` → `&lt;p&gt;`), causing raw markup to appear in the editor. The AI traced the data flow across three files (`Dashboard.tsx` → `page.tsx` → API) and added an `isHtml` boolean flag to bypass escaping for Word documents.

---

## 3. What AI-Generated Output Was Changed or Rejected

1. **Upgrading Node.js Type Definitions**
   * Next.js templates default to `@types/node@20`, which predates the native SQLite module. TypeScript threw `Cannot find module 'node:sqlite'`. The AI ran `npm install --save-dev @types/node@22` to resolve it.

2. **Resolving Windows File Locking in Tests**
   * The integration test suite failed on Windows when trying to `unlink` the test database — `EBUSY` because the SQLite file handle was still open. The AI added a `closeDb()` helper that closes all active connection pools and file handles, called in the test teardown before deletion.

3. **Tailwind CSS v4 Dark Mode**
   * Tailwind v4 changed dark mode to use `prefers-color-scheme` media queries by default, ignoring the `.dark` class toggle on `<body>`. The AI updated `globals.css` to declare a selector-based dark mode variant (`@variant dark (&:where(.dark, .dark *))`) to restore manual toggle support.

---

## 4. Verification and Reliability Strategy

* **TypeScript Build:** `npm run build` — confirms the full codebase compiles, types are correct, and all App Router pages generate successfully.
* **Automated Integration Tests:** `npm test` — 10 passing assertions covering:
  1. Database seeding
  2. Document creation
  3. Owner read permissions
  4. Unauthorized access denial
  5. Read-only share grant
  6. Blocked PATCH for read-only user
  7. Permission elevation (read → write)
  8. Editor write confirmed
* **Manual Browser Verification:** Verified dashboard, account switching, editor toolbar, autosave, file imports (`.txt`, `.md`, `.docx`), sharing flow, permission enforcement, and exports in the browser.
