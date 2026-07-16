import test from "node:test";
import assert from "node:assert";
import { initDb, closeDb } from "../lib/db";
import { GET as getUsers } from "../app/api/users/route";
import { GET as getDocs, POST as createDoc } from "../app/api/documents/route";
import { GET as getDoc, PATCH as updateDoc, DELETE as deleteDoc } from "../app/api/documents/[id]/route";
import { GET as getShares, POST as createShare, DELETE as deleteShare } from "../app/api/documents/[id]/shares/route";
import { NextRequest } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";

// Point DATABASE_URL to a separate test database file before initializing the DB
const testDbFile = "./database-test.db";
process.env.DATABASE_URL = `file:${testDbFile}`;

test("Axe Docs API Integration Tests", async (t) => {
  // Clear any existing test database
  const absolutePath = path.resolve(testDbFile);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }

  // Force database connection and migrations
  initDb();
  // Sleep briefly to allow asynchronous migrations and seeding to execute
  await new Promise((resolve) => setTimeout(resolve, 800));

  await t.test("Seeded users are present", async () => {
    const res = await getUsers();
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.length, 3);
    
    const alice = data.find((u: any) => u.username === "alice");
    assert.ok(alice);
    assert.strictEqual(alice.id, "user_alice");
  });

  let testDocId = "";

  await t.test("Create a new document as Alice", async () => {
    const req = new NextRequest("http://localhost:3000/api/documents", {
      method: "POST",
      headers: {
        "x-user-id": "user_alice",
      },
    });

    const res = await createDoc(req);
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.title, "Untitled Document");
    assert.strictEqual(data.ownerId, "user_alice");
    assert.ok(data.id);
    testDocId = data.id;
  });

  await t.test("Alice can read her own document", async () => {
    const req = new NextRequest(`http://localhost:3000/api/documents/${testDocId}`, {
      headers: {
        "x-user-id": "user_alice",
      },
    });

    const res = await getDoc(req, { params: Promise.resolve({ id: testDocId }) });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.id, testDocId);
    assert.strictEqual(data.accessLevel, "owner");
  });

  await t.test("Bob is blocked from reading Alice's document", async () => {
    const req = new NextRequest(`http://localhost:3000/api/documents/${testDocId}`, {
      headers: {
        "x-user-id": "user_bob",
      },
    });

    const res = await getDoc(req, { params: Promise.resolve({ id: testDocId }) });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.ok(data.error.includes("Access Denied"));
  });

  await t.test("Alice shares document with Bob as Read-Only", async () => {
    const req = new NextRequest(`http://localhost:3000/api/documents/${testDocId}/shares`, {
      method: "POST",
      headers: {
        "x-user-id": "user_alice",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usernameOrEmail: "bob",
        accessLevel: "read",
      }),
    });

    const res = await createShare(req, { params: Promise.resolve({ id: testDocId }) });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.share.username, "bob");
    assert.strictEqual(data.share.accessLevel, "read");
  });

  await t.test("Bob can now read the document as Read-Only", async () => {
    const req = new NextRequest(`http://localhost:3000/api/documents/${testDocId}`, {
      headers: {
        "x-user-id": "user_bob",
      },
    });

    const res = await getDoc(req, { params: Promise.resolve({ id: testDocId }) });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.accessLevel, "read");
  });

  await t.test("Bob is blocked from editing (PATCH) the document", async () => {
    const req = new NextRequest(`http://localhost:3000/api/documents/${testDocId}`, {
      method: "PATCH",
      headers: {
        "x-user-id": "user_bob",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Bob tries to rename",
      }),
    });

    const res = await updateDoc(req, { params: Promise.resolve({ id: testDocId }) });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.ok(data.error.includes("read-only"));
  });

  await t.test("Alice elevates Bob to Editor", async () => {
    const req = new NextRequest(`http://localhost:3000/api/documents/${testDocId}/shares`, {
      method: "POST",
      headers: {
        "x-user-id": "user_alice",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usernameOrEmail: "bob",
        accessLevel: "write",
      }),
    });

    const res = await createShare(req, { params: Promise.resolve({ id: testDocId }) });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.share.accessLevel, "write");
  });

  await t.test("Bob can now edit (PATCH) the document successfully", async () => {
    const req = new NextRequest(`http://localhost:3000/api/documents/${testDocId}`, {
      method: "PATCH",
      headers: {
        "x-user-id": "user_bob",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Project Alpha Roadmap",
        content: "<p>New document body</p>",
      }),
    });

    const res = await updateDoc(req, { params: Promise.resolve({ id: testDocId }) });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.document.title, "Project Alpha Roadmap");
    assert.strictEqual(data.document.content, "<p>New document body</p>");
  });

  // Cleanup test database file at the end
  closeDb();
  if (fs.existsSync(absolutePath)) {
    try {
      fs.unlinkSync(absolutePath);
    } catch (err: any) {
      console.warn("Could not delete test database file:", err.message);
    }
  }
});
