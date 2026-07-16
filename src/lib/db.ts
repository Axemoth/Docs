import { DatabaseSync } from "node:sqlite";
import { Pool } from "pg";
import * as fs from "node:fs";
import * as path from "node:path";

let sqliteDb: DatabaseSync | null = null;
let pgPool: Pool | null = null;
let isPostgres = false;
let initializationPromise: Promise<void> | null = null;

type DatabaseRow = Record<string, unknown>;
type DatabaseParameter = string | number | bigint | Uint8Array | null;

// Converts database snake_case keys to JavaScript camelCase keys
function toCamelCase(row: DatabaseRow | undefined): DatabaseRow | undefined {
  if (!row) return row;
  const newRow: DatabaseRow = {};
  for (const key of Object.keys(row)) {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    newRow[camelKey] = row[key];
  }
  return newRow;
}

// Initialize database
export function initDb() {
  if (initializationPromise) return;

  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://"))) {
    isPostgres = true;
    pgPool = new Pool({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false, // Required for secure connections to Neon DB
      },
    });
    console.log("Database initialized: PostgreSQL (Neon DB Mode)");
  } else {
    isPostgres = false;
    let dbPath = "./database.db";
    if (dbUrl && dbUrl.startsWith("file:")) {
      dbPath = dbUrl.substring(5); // strip "file:"
    }

    // Ensure the folder containing the SQLite database exists
    const absolutePath = path.resolve(dbPath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    sqliteDb = new DatabaseSync(dbPath);
    sqliteDb.exec("PRAGMA foreign_keys = ON;");
    console.log(`Database initialized: SQLite Mode (${dbPath})`);
  }

  initializationPromise = runMigrationsAndSeed();
}

// Cleanly closes database connection handles
export function closeDb() {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
  if (pgPool) {
    pgPool.end();
    pgPool = null;
  }
  isPostgres = false;
  initializationPromise = null;
}

async function ensureInitialized() {
  initDb();
  await initializationPromise;
}

async function execRaw(sql: string): Promise<void> {
  if (isPostgres) {
    await pgPool!.query(sql);
  } else {
    sqliteDb!.exec(sql);
  }
}

async function queryRaw(sql: string, params: DatabaseParameter[] = []): Promise<DatabaseRow[]> {
  if (isPostgres) {
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const res = await pgPool!.query(pgSql, params);
    return res.rows.map((row) => toCamelCase(row) ?? {});
  }

  const stmt = sqliteDb!.prepare(sql);
  const rows = stmt.all(...params) as DatabaseRow[];
  return rows.map((row) => toCamelCase(row) ?? {});
}

async function executeRaw(sql: string, params: DatabaseParameter[] = []): Promise<{ changes: number; lastInsertId?: string }> {
  if (isPostgres) {
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const res = await pgPool!.query(pgSql, params);
    return { changes: res.rowCount ?? 0 };
  }

  const stmt = sqliteDb!.prepare(sql);
  const result = stmt.run(...params) as unknown as {
    changes: number;
    lastInsertRowid?: bigint;
  };
  return {
    changes: result.changes,
    lastInsertId: result.lastInsertRowid?.toString(),
  };
}

// Executes multi-statement SQL scripts (like schema creation)
export async function exec(sql: string): Promise<void> {
  await ensureInitialized();
  await execRaw(sql);
}

// Executes SELECT queries and returns an array of camelCased objects
export async function query<T = DatabaseRow>(sql: string, params: DatabaseParameter[] = []): Promise<T[]> {
  await ensureInitialized();
  return (await queryRaw(sql, params)) as T[];
}

// Executes INSERT, UPDATE, DELETE queries
export async function execute(sql: string, params: DatabaseParameter[] = []): Promise<{ changes: number; lastInsertId?: string }> {
  await ensureInitialized();
  return executeRaw(sql, params);
}

// Run schema setup and seed mock users if tables are empty
async function runMigrationsAndSeed() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      access_level TEXT NOT NULL,
      FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(document_id, user_id)
    );
  `;

  try {
    await execRaw(schema);
    console.log("Database schema verified/created successfully.");

    // Seed mock users if the users table is empty
    const countResult = await queryRaw("SELECT COUNT(*) as count FROM users");
    const count = countResult[0]?.count ?? 0;

    if (Number(count) === 0) {
      console.log("Database is empty. Seeding mock users (Rushil, Yash, Aditya)...");
      await executeRaw("INSERT INTO users (id, username, email) VALUES (?, ?, ?)", [
        "user_rushil",
        "rushil",
        "rushil.gorasia@gmail.com",
      ]);
      await executeRaw("INSERT INTO users (id, username, email) VALUES (?, ?, ?)", [
        "user_yash",
        "yash",
        "yash@example.com",
      ]);
      await executeRaw("INSERT INTO users (id, username, email) VALUES (?, ?, ?)", [
        "user_aditya",
        "aditya",
        "aditya@example.com",
      ]);
      console.log("Database seeded successfully.");
    }
  } catch (error) {
    console.error("Failed to run database migrations or seeding:", error);
  }
}
