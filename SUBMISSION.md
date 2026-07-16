# Axe Docs — Submission

## Links to add before submitting

- **Google Drive folder:** `ADD_GOOGLE_DRIVE_FOLDER_URL`
- **Live application:** `ADD_VERCEL_URL`
- **Walkthrough video:** `ADD_LOOM_OR_YOUTUBE_URL`

## Candidate

- **Name:** Rushil Gorasia
- **Email:** rushil.gorasia@gmail.com
- **Resume:** https://drive.google.com/file/d/11j88sp_y3gRS-YRbAvfP1e2IC4Qs1Dpd/view?usp=sharing

## Project overview

Axe Docs is a lightweight collaborative document editor built as a focused Google Docs-inspired product slice. It supports document creation, rich-text editing, autosave, plain-text/Markdown import, sharing with viewer/editor permissions, and persistent storage.

**Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, SQLite for local development, PostgreSQL/Neon for deployment, and Docker.

## Reviewer quick start

1. Open the live application URL above.
2. Choose a seeded **demo account** from the landing screen.
3. Create a document or import a `.txt` / `.md` file (up to 200 KB).
4. As Rushil, share the document with `yash` as **Can View** or **Can Edit**.
5. Switch demo accounts in the header to verify the shared-document and permission states.

The application uses deliberately mocked authentication for this assessment. Account selection is a demo mechanism, not production authentication.

### Seeded demo accounts

| Account | Username | Email |
| --- | --- | --- |
| Owner | `rushil` | `rushil.gorasia@gmail.com` |
| Collaborator | `yash` | `yash@example.com` |
| Collaborator | `aditya` | `aditya@example.com` |

## What is included

- Create, rename, edit, reopen, and delete owner documents.
- Rich-text toolbar: bold, italic, underline, headings, paragraph, ordered/unordered lists, and clear formatting.
- Debounced autosave with saving, saved, and failure states.
- `.txt` and `.md` import from the dashboard or into an open document; Markdown export.
- Owner/viewer/editor sharing model with server-side permission checks.
- Clear owned vs shared document states and read-only editor mode.
- SQLite local persistence and PostgreSQL persistence when `DATABASE_URL` is configured.
- Input validation, sanitized stored rich text, and file-size/type feedback.
- Docker configuration, setup instructions, architecture note, and AI workflow note.
- Automated API coverage for document creation, access denial, viewer/editor permissions, and edits.

## Verification completed

- `npx tsc --noEmit`
- `npm run lint`
- `npm test` — 10 passing assertions
- `npm run build`

## Intentional scope cuts

- No real-time cursors or presence indicators.
- No version history, comments, or suggestion mode.
- No production authentication; demo account switching is used to make sharing reviewable without external credentials.
- Import is intentionally limited to `.txt` and `.md` files.

With another 2–4 hours, I would add document version history, optimistic concurrency for simultaneous edits, and real authentication.

## Setup and deployment notes

See [README.md](README.md) for local and Docker setup. For Vercel, configure `DATABASE_URL` as an environment variable. It is kept in `.env.local` locally and is not committed to Git.

## Included files

- `README.md` — setup, local development, Docker, and deployment instructions
- `architecture.md` — implementation decisions and tradeoffs
- `ai_workflow.md` — AI tools, changes to generated output, and verification approach
- `src/` — application, API routes, database layer, and tests
- `Dockerfile` and `docker-compose.yml` — container configuration
- `package.json` — scripts and dependencies

Before final submission, replace the three link placeholders at the top of this file and include the walkthrough URL in a separate `walkthrough-video.txt` file in the Drive folder.
