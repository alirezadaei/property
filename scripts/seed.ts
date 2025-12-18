import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { listings } from "../src/db/schema";
import sampleData from "../sample-data.json";

const sqlite = new Database("./sqlite.db");
const db = drizzle(sqlite);

async function seed() {
  console.log("🌱 Seeding database...");

  // Create tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS listing (
      id TEXT PRIMARY KEY,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      price INTEGER NOT NULL,
      beds INTEGER NOT NULL,
      baths INTEGER NOT NULL,
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_search (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      q TEXT,
      min_price INTEGER,
      max_price INTEGER,
      beds_min INTEGER,
      baths_min INTEGER,
      center_lat REAL,
      center_lng REAL,
      radius_km REAL,
      created_at TEXT NOT NULL
    );
  `);

  // Clear existing data
  sqlite.exec("DELETE FROM listing");
  sqlite.exec("DELETE FROM saved_search");

  // Insert sample listings
  for (const item of sampleData) {
    db.insert(listings)
      .values({
        id: item.id,
        address: item.address,
        city: item.city,
        lat: item.lat,
        lng: item.lng,
        price: item.price,
        beds: item.beds,
        baths: item.baths,
        status: item.status,
        updatedAt: item.updated_at,
      })
      .run();
  }

  console.log(`✅ Seeded ${sampleData.length} listings`);
  console.log("✨ Database ready!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
