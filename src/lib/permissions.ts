import { query } from "./db";

export type AccessLevel = "owner" | "write" | "read";

/**
 * Checks a user's access level for a specific document.
 * Returns:
 * - 'owner': If the user owns the document
 * - 'write': If the document is shared with the user with edit permissions
 * - 'read': If the document is shared with the user with read-only permissions
 * - null: If the user has no access (or document doesn't exist)
 */
export async function getDocumentAccess(documentId: string, userId: string): Promise<AccessLevel | null> {
  try {
    // 1. Check if the user is the owner
    const docResult = await query("SELECT owner_id FROM documents WHERE id = ?", [documentId]);
    if (!docResult || docResult.length === 0) {
      return null; // Document does not exist
    }

    const doc = docResult[0];
    if (doc.ownerId === userId) {
      return "owner";
    }

    // 2. Check if the document has been shared with this user
    const shareResult = await query(
      "SELECT access_level FROM shares WHERE document_id = ? AND user_id = ?",
      [documentId, userId]
    );

    if (shareResult && shareResult.length > 0) {
      const share = shareResult[0];
      return share.accessLevel as AccessLevel;
    }

    return null; // No access
  } catch (error) {
    console.error("Error checking document access permissions:", error);
    return null;
  }
}
