# Axe Docs

Axe Docs is a lightweight, high-performance collaborative document editor inspired by Google Docs, built using Next.js, React 19, Tailwind CSS v4, and SQLite/PostgreSQL.

It allows creating documents, formatting text (Bold, Italic, Underline, Headers, Lists), autosaving modifications, uploading and importing text/markdown files, switching sessions (mock auth), and sharing documents (view vs edit permissions) with access control.

---

## 1. Quick Start (Running Locally)

You can run Axe Docs locally using Node.js. It defaults to a zero-configuration SQLite database (`database.db`), which will be created automatically in your root folder.

### Prerequisites
* **Node.js:** Version 22.5.0 or higher is required (uses the native `node:sqlite` module to avoid compiler issues).
* **Package Manager:** npm (installed automatically with Node).

### Installation & Execution
1. Install the dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to:
   **[http://localhost:3000](http://localhost:3000)**

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

---

## 4. Seeding & Mock Accounts (Mock Auth)

Authentication is mocked. You can switch between users in the top-right corner of the header. The application is seeded with the following three accounts:

* **Rushil:** Username: `rushil` | Email: `rushil.gorasia@gmail.com`
* **Yash:** Username: `yash` | Email: `yash@example.com`
* **Aditya:** Username: `aditya` | Email: `aditya@example.com`

---

## 5. Live Production Deployment (Vercel + Neon Postgres)

Axe Docs automatically detects the presence of a PostgreSQL connection string. If you supply a `DATABASE_URL` environment variable, it swaps database drivers and runs migrations in the cloud.

### Step 1: Configure Neon DB
Create a `.env.local` file in the project root with your Neon connection string. This file is ignored by Git.
```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
```
The tables migrate and seeded evaluation accounts are created automatically on first startup.

### Step 2: Deploy to Vercel
1. Initialize a Git repository on your GitHub account.
2. Push this project to your repository.
3. Import the repository into your Vercel Dashboard.
4. Under **Environment Variables**, add:
   * **Key:** `DATABASE_URL`
   * **Value:** Your production Neon `DATABASE_URL` value
5. Click **Deploy**. Vercel will build the standalone Next.js application, and it will immediately connect to your persistent Postgres cloud database.
