import { Metadata } from "next";
import { sqliteDb } from "@/db";
import SearchPageClient from "@/components/SearchPageClient";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export const metadata: Metadata = {
  title: "Search Properties - Dubai Real Estate Explorer",
  description:
    "Browse and search thousands of properties in Dubai with advanced filters and interactive map",
  openGraph: {
    title: "Search Properties - Dubai Real Estate Explorer",
    description: "Browse and search thousands of properties in Dubai",
  },
};

interface SearchPageProps {
  searchParams: {
    q?: string;
    min_price?: string;
    max_price?: string;
    beds_min?: string;
    baths_min?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, min_price, max_price, beds_min, baths_min } = searchParams;

  let conditions: string[] = [];
  let params: any[] = [];

  if (q) {
    conditions.push("address LIKE ?");
    params.push(`%${q}%`);
  }

  if (min_price) {
    conditions.push("price >= ?");
    params.push(Number(min_price));
  }

  if (max_price) {
    conditions.push("price <= ?");
    params.push(Number(max_price));
  }

  if (beds_min) {
    conditions.push("beds >= ?");
    params.push(Number(beds_min));
  }

  if (baths_min) {
    conditions.push("baths >= ?");
    params.push(Number(baths_min));
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT * FROM listing
    ${whereClause}
    ORDER BY updated_at DESC
    LIMIT 50
  `;

  const listings = sqliteDb.prepare(query).all(...params) as any[];

  return <SearchPageClient listings={listings} />;
}
