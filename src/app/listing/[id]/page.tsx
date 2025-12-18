import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { formatPrice, formatDate, calculateDistance } from "@/lib/utils";
import ListingCard from "@/components/ListingCard";

export const revalidate = 60;

interface ListingDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: ListingDetailPageProps): Promise<Metadata> {
  const listing = db.get(sql.raw("SELECT * FROM listing WHERE id = ?"), [
    params.id,
  ]) as any;

  if (!listing) {
    return {
      title: "Listing Not Found",
    };
  }

  return {
    title: `${listing.address} - ${formatPrice(
      listing.price
    )} | Property Explorer`,
    description: `${listing.beds} bed, ${listing.baths} bath property in ${
      listing.city
    }. ${listing.status.replace("_", " ")}`,
    openGraph: {
      title: listing.address,
      description: `${formatPrice(listing.price)} • ${listing.beds} bed • ${
        listing.baths
      } bath`,
    },
  };
}

export default async function ListingDetailPage({
  params,
}: ListingDetailPageProps) {
  const listing = db.get(sql.raw("SELECT * FROM listing WHERE id = ?"), [
    params.id,
  ]) as any;

  if (!listing) {
    notFound();
  }

  // Find similar nearby listings
  const allListings = db.all(sql.raw("SELECT * FROM listing")) as any[];
  const nearbyListings = allListings
    .filter((l) => l.id !== listing.id)
    .map((l) => ({
      ...l,
      distance: calculateDistance(listing.lat, listing.lng, l.lat, l.lng),
    }))
    .filter((l) => l.distance <= 5) // Within 5km
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Search
        </Link>
      </div>

      {/* Main listing details */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        {/* Header */}
        <div className="border-b pb-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {listing.address}
              </h1>
              <p className="text-xl text-gray-600">{listing.city}</p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                listing.status === "for_sale"
                  ? "bg-green-100 text-green-800"
                  : listing.status === "for_rent"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {listing.status.replace("_", " ").toUpperCase()}
            </span>
          </div>

          <div className="text-4xl font-bold text-blue-600 mb-4">
            {formatPrice(listing.price)}
          </div>

          <div className="flex gap-6 text-lg text-gray-700">
            <div className="flex items-center gap-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span>
                <strong>{listing.beds}</strong> Bedrooms
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                />
              </svg>
              <span>
                <strong>{listing.baths}</strong> Bathrooms
              </span>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Property Details
            </h3>
            <dl className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-gray-600">Property ID</dt>
                <dd className="font-medium">{listing.id}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-gray-600">City</dt>
                <dd className="font-medium">{listing.city}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-gray-600">Status</dt>
                <dd className="font-medium capitalize">
                  {listing.status.replace("_", " ")}
                </dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-gray-600">Last Updated</dt>
                <dd className="font-medium">{formatDate(listing.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Location
            </h3>
            <dl className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-gray-600">Latitude</dt>
                <dd className="font-medium">{listing.lat.toFixed(4)}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-gray-600">Longitude</dt>
                <dd className="font-medium">{listing.lng.toFixed(4)}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-gray-600">Address</dt>
                <dd className="font-medium text-sm">{listing.address}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Similar nearby listings */}
      {nearbyListings.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Similar Properties Nearby
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyListings.map((nearby) => (
              <div key={nearby.id} className="relative">
                <ListingCard listing={nearby} />
                <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded shadow text-xs font-semibold text-gray-700">
                  {nearby.distance.toFixed(1)} km away
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
