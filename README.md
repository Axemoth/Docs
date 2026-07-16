# Axe Docs

Axe Docs is a lightweight, high-performance collaborative document editor inspired by Google Docs, built using Next.js, React 19, Tailwind CSS v4, and SQLite/PostgreSQL.

It supports creating documents, rich-text formatting (Bold, Italic, Underline, Headers, Lists), debounced autosave, importing `.txt` / `.md` / `.docx` (Word) files, exporting to Markdown / Word / PDF, switching sessions (mock auth), and sharing documents with viewer/editor access control enforced on both the client and server.

---

## 1. Quick Start (Running Locally)

You can run Axe Docs locally using Node.js. It defaults to a zero-configuration SQLite database (`database.db`), which will be created automatically in your root folder.

### Prerequisites
* **Node.js:** Version 22.5.0 or higher is required (uses the native `node:sqlite` module to avoid compiler issues).
* **Package Manager:** npm (installed automatically with Node).

### Installation & Execution
1. Clone the repository:
   ```bash
   git clone https://github.com/Axemoth/Docs.git
   cd Docs
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   **[http://localhost:3000](http://localhost:3000)**

> No `.env` file is needed for local development. The app automatically uses SQLite.

---

## 2. Running via Docker

If you prefer to run the application containerized, we have provided a multi-stage `Dockerfile` and a `docker-compose.yml` file.

### Execution
1. Start the container in detached mode:
   ```bash
   docker-compose up --build
   ```
2. Open your browser and navigate to:
   **[http://localhost:3000](http://localhost:3000)**
3. To stop the container, run:
   ```bash
   docker-compose down
   ```

---

## 3. Running Automated Tests

We wrote an automated integration test suite that tests document creation, permissions, sharing logic, and edit restrictions. It runs against a separate test database (`database-test.db`) and automatically cleans up afterwards.

To execute the tests, run:
```bash
npm test
```

Expected output: **10 passing** assertions.

---

## 4. Seeded Mock Accounts (Mock Auth)

Authentication is mocked. You can switch between users in the top-right corner of the header. The application is seeded with the following three accounts:

| Account | Username | Email |
|---|---|---|
| Owner | `rushil` | `rushil.gorasia@gmail.com` |
| Collaborator | `yash` | `yash@example.com` |
| Collaborator | `aditya` | `aditya@example.com` |

---

## 5. Live Production Deployment (Vercel + Neon Postgres)

Axe Docs automatically detects the presence of a PostgreSQL connection string. If you supply a `DATABASE_URL` environment variable, it swaps database drivers and runs migrations in the cloud.

### Step 1: Configure Neon DB
Create a `.env.local` file in the project root with your Neon connection string. This file is ignored by Git.
```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
```
The tables and seeded evaluation accounts are created automatically on first startup.

### Step 2: Deploy to Vercel
1. Push the project to your GitHub repository.
2. Import the repository into your Vercel Dashboard.
3. Under **Environment Variables**, add:
   * **Key:** `DATABASE_URL`
   * **Value:** Your production Neon `DATABASE_URL` value
4. Click **Deploy**. Vercel will build the standalone Next.js application and connect to your Neon Postgres database automatically.
