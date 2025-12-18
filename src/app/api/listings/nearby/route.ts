import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { nearbyQuerySchema } from "@/lib/validations";
import { calculateDistance } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = nearbyQuerySchema.parse(searchParams);

    const allListings = db.all(sql.raw("SELECT * FROM listing")) as any[];

    const nearbyListings = allListings
      .map((listing) => ({
        ...listing,
        distance: calculateDistance(
          query.lat,
          query.lng,
          listing.lat,
          listing.lng
        ),
      }))
      .filter((listing) => listing.distance <= query.radius_km)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, query.limit);

    return NextResponse.json(nearbyListings, {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    console.error("Error fetching nearby listings:", error);
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 }
    );
  }
}
