import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const users = await query("SELECT id, username, email FROM users ORDER BY username ASC");
    return NextResponse.json(users);
  } catch (error: any) {
    console.error("API error fetching users:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status: 500 });
  }
}
