import { DatabaseSync } from "node:sqlite";
import { Pool } from "pg";
import * as fs from "node:fs";
import * as path from "node:path";

let sqliteDb: DatabaseSync | null = null;
let pgPool: Pool | null = null;
let isPostgres = false;

// Converts database snake_case keys to JavaScript camelCase keys
function toCamelCase(row: any): any {
  if (!row) return row;
  const newRow: any = {};
  for (const key of Object.keys(row)) {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    newRow[camelKey] = row[key];
  }
  return newRow;
}

// Initialize database
export function initDb() {
  if (sqliteDb || pgPool) return; // Already initialized

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
    console.log(`Database initialized: SQLite Mode (${dbPath})`);
  }

  // Run migrations and seed tables asynchronously
  runMigrationsAndSeed();
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
}

// Executes multi-statement SQL scripts (like schema creation)
export async function exec(sql: string): Promise<void> {
  if (!sqliteDb && !pgPool) {
    initDb();
  }

  if (isPostgres) {
    await pgPool!.query(sql);
  } else {
    sqliteDb!.exec(sql);
  }
}

// Executes SELECT queries and returns an array of camelCased objects
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (!sqliteDb && !pgPool) {
    initDb();
  }

  if (isPostgres) {
    // Convert ? positional placeholders to Postgres $1, $2, etc.
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const res = await pgPool!.query(pgSql, params);
    return res.rows.map(toCamelCase);
  } else {
    const stmt = sqliteDb!.prepare(sql);
    const rows = stmt.all(...params) as any[];
    return rows.map(toCamelCase);
  }
}

// Executes INSERT, UPDATE, DELETE queries
export async function execute(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertId?: string }> {
  if (!sqliteDb && !pgPool) {
    initDb();
  }

  if (isPostgres) {
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const res = await pgPool!.query(pgSql, params);
    return { changes: res.rowCount ?? 0 };
  } else {
    const stmt = sqliteDb!.prepare(sql);
    const result = stmt.run(...params) as any;
    return {
      changes: result.changes,
      lastInsertId: result.lastInsertRowid?.toString(),
    };
  }
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
    await exec(schema);
    console.log("Database schema verified/created successfully.");

    // Seed mock users if the users table is empty
    const countResult = await query("SELECT COUNT(*) as count FROM users");
    const count = countResult[0]?.count ?? 0;

    if (Number(count) === 0) {
      console.log("Database is empty. Seeding mock users (Rushil, Yash, Aditya)...");
      await execute("INSERT INTO users (id, username, email) VALUES (?, ?, ?)", [
        "user_rushil",
        "rushil",
        "rushil.gorasia@gmail.com",
      ]);
      await execute("INSERT INTO users (id, username, email) VALUES (?, ?, ?)", [
        "user_yash",
        "yash",
        "yash@example.com",
      ]);
      await execute("INSERT INTO users (id, username, email) VALUES (?, ?, ?)", [
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
