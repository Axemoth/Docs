# AI-Native Workflow Note - Axe Docs

This note documents how AI tools were leveraged to build, iterate, and verify Axe Docs.

---

## 1. AI Tools Used
* **Antigravity (Gemini 3.5 Flash - High):** Leveraged as an autonomous, agentic coding assistant to design the full-stack architecture, execute commands, create files, run automated builds/tests, and write documentation.

---

## 2. Where AI Materially Sped Up the Project

1. **Bypassing Naming Restraints (Bootstrapping):**
   * **Problem:** `create-next-app` refused to run in our workspace directory (`Ajaj ai assesment`) because of spaces and uppercase letters.
   * **AI Acceleration:** The AI suggested and executed a script to spin up the app in a temporarily named subfolder (`doc-editor`) and pull the files up to the root, resolving the naming issue in under a minute.
2. **Dual-Driver Connection Adapter (`src/lib/db.ts`):**
   * **Problem:** Implementing an ORM like Prisma or a query builder like Knex would have required massive configuration and multiple npm packages, increasing the risk of version mismatch.
   * **AI Acceleration:** The AI wrote a lightweight database manager that handles SQLite locally and Postgres in the cloud, translating SQL placeholders on the fly using a regex matcher (`?` to `$1`). This kept our dependencies minimal and highly portable.
3. **The Rich-Text Focus Trap:**
   * **Problem:** Creating a custom `contentEditable` editor usually suffers from focus loss when clicking toolbar buttons, causing formatting commands to fail.
   * **AI Acceleration:** The AI immediately solved this by using `onMouseDown={(e) => e.preventDefault()}` on the toolbar buttons, preventing the browser from moving the cursor focus away from the editor sheet.

---

## 3. What AI-Generated Output Was Changed or Rejected

1. **Upgrading Node.js Type Definitions (`package.json`):**
   * **Problem:** During compilation, the TypeScript compiler threw an error: `Cannot find module 'node:sqlite' or its corresponding type declarations`.
   * **Revision:** The AI discovered that the Next.js template defaults to node 20 types, which predated the native SQLite module. The AI ran `npm install --save-dev @types/node@22` to upgrade the typings, resolving the error.
2. **Releasing Database File Locks (`src/lib/db.ts` & `src/tests/api.test.ts`):**
   * **Problem:** On Windows, the integration test suite failed at the very end when unlinking the temporary `database-test.db` file, throwing an `EBUSY` error because the file was locked.
   * **Revision:** We added a `closeDb()` helper in `db.ts` to close active connection pools and SQLite file handles, calling it in the test suite cleanup before unlinking the database. This resolved the Windows file locking issue.

---

## 4. Verification and Reliability Strategy

* **Type Safety & Build Verification:** We executed `npm run build` to confirm that the entire codebase (types, App Router, assets, static pages generation) compiles successfully.
* **Automated Integration Tests:** We wrote 10 assertions in `src/tests/api.test.ts` checking:
  1. Default database seeding.
  2. Document creation.
  3. Owner read permissions.
  4. Blocked access for unauthorized users.
  5. Read-only sharing view.
  6. Blocked updates for read-only users.
  7. Read-to-write permission elevation.
  8. Editor write permissions.
* **Manual Browser Verification:** We booted the server and verified that the dashboard, user switcher, editor styling, autosave debounce, and text file uploads functioned smoothly in the browser.
