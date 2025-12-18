import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { sql } from "drizzle-orm";
import { listingQuerySchema } from "@/lib/validations";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = listingQuerySchema.parse(searchParams);

    let conditions = [];
    let params: any[] = [];

    if (query.q) {
      conditions.push("address LIKE ?");
      params.push(`%${query.q}%`);
    }

    if (query.min_price !== undefined) {
      conditions.push("price >= ?");
      params.push(query.min_price);
    }

    if (query.max_price !== undefined) {
      conditions.push("price <= ?");
      params.push(query.max_price);
    }

    if (query.beds_min !== undefined) {
      conditions.push("beds >= ?");
      params.push(query.beds_min);
    }

    if (query.baths_min !== undefined) {
      conditions.push("baths >= ?");
      params.push(query.baths_min);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (query.page - 1) * query.limit;

    const itemsQuery = `
      SELECT * FROM listing
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as count FROM listing
      ${whereClause}
    `;

    const items = db.all(sql.raw(itemsQuery), [...params, query.limit, offset]);
    const [{ count }] = db.all(sql.raw(countQuery), params) as any;

    return NextResponse.json(
      { items, total: count },
      {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=60",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 }
    );
  }
}
