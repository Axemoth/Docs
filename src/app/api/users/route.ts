import { NextResponse } from "next/server";
import { query } from "@/lib/db";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error";
}

export async function GET() {
  try {
    const users = await query("SELECT id, username, email FROM users ORDER BY username ASC");
    return NextResponse.json(users);
  } catch (error: unknown) {
    console.error("API error fetching users:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
