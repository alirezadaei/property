import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { savedSearches } from "@/db/schema";
import { sql } from "drizzle-orm";
import { savedSearchSchema } from "@/lib/validations";

const GUEST_USER_ID = "guest";

export async function GET() {
  try {
    const searches = db.all(
      sql.raw(
        "SELECT * FROM saved_search WHERE user_id = ? ORDER BY created_at DESC"
      ),
      [GUEST_USER_ID]
    );

    return NextResponse.json(searches);
  } catch (error) {
    console.error("Error fetching saved searches:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved searches" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = savedSearchSchema.parse(body);

    const id = `search-${Date.now()}`;
    const createdAt = new Date().toISOString();

    db.run(
      sql.raw(`
        INSERT INTO saved_search (
          id, user_id, name, q, min_price, max_price,
          beds_min, baths_min, center_lat, center_lng,
          radius_km, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      [
        id,
        GUEST_USER_ID,
        data.name,
        data.q || null,
        data.min_price || null,
        data.max_price || null,
        data.beds_min || null,
        data.baths_min || null,
        data.center_lat || null,
        data.center_lng || null,
        data.radius_km || null,
        createdAt,
      ]
    );

    const newSearch = db.get(
      sql.raw("SELECT * FROM saved_search WHERE id = ?"),
      [id]
    );

    return NextResponse.json(newSearch, { status: 201 });
  } catch (error: any) {
    console.error("Error creating saved search:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create saved search" },
      { status: 400 }
    );
  }
}
