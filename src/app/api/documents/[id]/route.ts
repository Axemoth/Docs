import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { sanitizeDocumentContent, validateDocumentTitle } from "@/lib/document-validation";
import { getDocumentAccess } from "@/lib/permissions";

interface DocumentRecord {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error";
}

// GET /api/documents/[id] - Get details of a single document
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Missing x-user-id header" }, { status: 401 });
    }

    // 1. Verify access permissions
    const accessLevel = await getDocumentAccess(id, userId);
    if (!accessLevel) {
      return NextResponse.json({ error: "Access Denied: You do not have permission to view this document" }, { status: 403 });
    }

    // 2. Fetch the document details
    const docResult = await query<DocumentRecord>("SELECT * FROM documents WHERE id = ?", [id]);
    if (!docResult || docResult.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const doc = docResult[0];

    // 3. Join the owner's username for visual context
    const ownerResult = await query<{ username: string }>("SELECT username FROM users WHERE id = ?", [doc.ownerId]);
    const ownerUsername = ownerResult[0]?.username ?? "unknown";

    const responseDoc = {
      ...doc,
      ownerUsername,
      accessLevel, // 'owner', 'write', or 'read'
    };

    return NextResponse.json(responseDoc);
  } catch (error: unknown) {
    console.error("API error fetching document details:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// PATCH /api/documents/[id] - Update a document (title and/or content)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Missing x-user-id header" }, { status: 401 });
    }

    // 1. Verify user has edit permissions (must be 'owner' or 'write')
    const accessLevel = await getDocumentAccess(id, userId);
    if (!accessLevel) {
      return NextResponse.json({ error: "Access Denied: You do not have permission to access this document" }, { status: 403 });
    }

    if (accessLevel === "read") {
      return NextResponse.json({ error: "Forbidden: You only have read-only access to this document" }, { status: 403 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { title, content } = body as { title?: unknown; content?: unknown };

    // 3. Fetch current values to support partial updates
    const docResult = await query<Pick<DocumentRecord, "title" | "content">>("SELECT title, content FROM documents WHERE id = ?", [id]);
    if (!docResult || docResult.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const currentDoc = docResult[0];
    let updatedTitle = currentDoc.title;
    let updatedContent = currentDoc.content;
    try {
      if (title !== undefined) updatedTitle = validateDocumentTitle(title);
      if (content !== undefined) updatedContent = sanitizeDocumentContent(content);
    } catch (error: unknown) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
    }
    const now = new Date().toISOString();

    // 4. Perform the update
    const updateSql = `
      UPDATE documents
      SET title = ?, content = ?, updated_at = ?
      WHERE id = ?
    `;

    await execute(updateSql, [updatedTitle, updatedContent, now, id]);

    return NextResponse.json({
      message: "Document updated successfully",
      document: {
        id,
        title: updatedTitle,
        content: updatedContent,
        updatedAt: now,
      },
    });
  } catch (error: unknown) {
    console.error("API error updating document:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// DELETE /api/documents/[id] - Delete a document (only owner can delete)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Missing x-user-id header" }, { status: 401 });
    }

    // 1. Verify user is the owner
    const accessLevel = await getDocumentAccess(id, userId);
    if (accessLevel !== "owner") {
      return NextResponse.json({ error: "Forbidden: Only the document owner can delete this document" }, { status: 403 });
    }

    // 2. Execute deletion (shares are deleted ON DELETE CASCADE)
    await execute("DELETE FROM documents WHERE id = ?", [id]);

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error: unknown) {
    console.error("API error deleting document:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
