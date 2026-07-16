import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getDocumentAccess } from "@/lib/permissions";

// GET /api/documents/[id]/shares - List all active shares for a document (owner only)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Missing x-user-id header" }, { status: 401 });
    }

    // 1. Verify user is the owner
    const accessLevel = await getDocumentAccess(id, userId);
    if (accessLevel !== "owner") {
      return NextResponse.json({ error: "Forbidden: Only the owner can view share settings" }, { status: 403 });
    }

    // 2. Fetch all shares with user details
    const sharesSql = `
      SELECT s.id, s.user_id, s.access_level, u.username, u.email
      FROM shares s
      JOIN users u ON s.user_id = u.id
      WHERE s.document_id = ?
    `;
    const shares = await query(sharesSql, [id]);

    return NextResponse.json(shares);
  } catch (error: any) {
    console.error("API error fetching share list:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch share list" }, { status: 500 });
  }
}

// POST /api/documents/[id]/shares - Add or update a share permission (owner only)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Missing x-user-id header" }, { status: 401 });
    }

    // 1. Verify user is the owner
    const accessLevel = await getDocumentAccess(id, userId);
    if (accessLevel !== "owner") {
      return NextResponse.json({ error: "Forbidden: Only the owner can share this document" }, { status: 403 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { usernameOrEmail, accessLevel: targetAccessLevel } = body;

    if (!usernameOrEmail || !targetAccessLevel || !["read", "write"].includes(targetAccessLevel)) {
      return NextResponse.json({ error: "Bad Request: Missing usernameOrEmail or invalid accessLevel" }, { status: 400 });
    }

    // 3. Find the target user in the database
    const userResult = await query(
      "SELECT id, username FROM users WHERE username = ? OR email = ?",
      [usernameOrEmail.toLowerCase().trim(), usernameOrEmail.toLowerCase().trim()]
    );

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: `User "${usernameOrEmail}" not found` }, { status: 404 });
    }

    const targetUser = userResult[0];

    // 4. Owner cannot share with themselves
    if (targetUser.id === userId) {
      return NextResponse.json({ error: "Cannot share a document with yourself" }, { status: 400 });
    }

    // 5. Check if the document is already shared with this user
    const existingShare = await query(
      "SELECT id FROM shares WHERE document_id = ? AND user_id = ?",
      [id, targetUser.id]
    );

    if (existingShare && existingShare.length > 0) {
      // Update existing share permission level
      await execute(
        "UPDATE shares SET access_level = ? WHERE document_id = ? AND user_id = ?",
        [targetAccessLevel, id, targetUser.id]
      );
    } else {
      // Create new share permission record
      const shareId = crypto.randomUUID();
      await execute(
        "INSERT INTO shares (id, document_id, user_id, access_level) VALUES (?, ?, ?, ?)",
        [shareId, id, targetUser.id, targetAccessLevel]
      );
    }

    return NextResponse.json({
      message: `Document shared with ${targetUser.username} successfully`,
      share: {
        userId: targetUser.id,
        username: targetUser.username,
        accessLevel: targetAccessLevel,
      },
    });
  } catch (error: any) {
    console.error("API error adding share permission:", error);
    return NextResponse.json({ error: error.message || "Failed to share document" }, { status: 500 });
  }
}

// DELETE /api/documents/[id]/shares - Remove share permission (owner only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    const targetUserId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Missing x-user-id header" }, { status: 401 });
    }
    if (!targetUserId) {
      return NextResponse.json({ error: "Bad Request: Missing userId query parameter" }, { status: 400 });
    }

    // 1. Verify user is the owner
    const accessLevel = await getDocumentAccess(id, userId);
    if (accessLevel !== "owner") {
      return NextResponse.json({ error: "Forbidden: Only the owner can remove share permissions" }, { status: 403 });
    }

    // 2. Delete share record
    await execute("DELETE FROM shares WHERE document_id = ? AND user_id = ?", [id, targetUserId]);

    return NextResponse.json({ message: "Share permission removed successfully" });
  } catch (error: any) {
    console.error("API error removing share permission:", error);
    return NextResponse.json({ error: error.message || "Failed to remove share permission" }, { status: 500 });
  }
}
