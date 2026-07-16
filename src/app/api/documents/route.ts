import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";

// GET /api/documents - Get all documents owned by or shared with the current user
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Missing x-user-id header" }, { status: 401 });
    }

    // Select documents owned by user OR shared with user
    // Joins users table to get the owner's username
    const sql = `
      SELECT d.id, d.title, d.owner_id, d.created_at, d.updated_at, u.username as owner_username,
             CASE WHEN d.owner_id = ? THEN 'owner' ELSE s.access_level END as access_level
      FROM documents d
      JOIN users u ON d.owner_id = u.id
      LEFT JOIN shares s ON d.id = s.document_id AND s.user_id = ?
      WHERE d.owner_id = ? OR s.user_id = ?
      ORDER BY d.updated_at DESC
    `;

    const docs = await query(sql, [userId, userId, userId, userId]);
    return NextResponse.json(docs);
  } catch (error: any) {
    console.error("API error fetching documents:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch documents" }, { status: 500 });
  }
}

// POST /api/documents - Create a new document
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Missing x-user-id header" }, { status: 401 });
    }

    // Verify the user exists
    const userExists = await query("SELECT id FROM users WHERE id = ?", [userId]);
    if (!userExists || userExists.length === 0) {
      return NextResponse.json({ error: "Unauthorized: User does not exist" }, { status: 403 });
    }

    const docId = crypto.randomUUID();
    const title = "Untitled Document";
    const content = ""; // Empty document body initially
    const now = new Date().toISOString();

    const insertSql = `
      INSERT INTO documents (id, title, content, owner_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await execute(insertSql, [docId, title, content, userId, now, now]);

    // Return the newly created document details
    const newDoc = {
      id: docId,
      title,
      content,
      ownerId: userId,
      createdAt: now,
      updatedAt: now,
      accessLevel: "owner",
    };

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error: any) {
    console.error("API error creating document:", error);
    return NextResponse.json({ error: error.message || "Failed to create document" }, { status: 500 });
  }
}
