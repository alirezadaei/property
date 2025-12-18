"use client";

import { Listing } from "@/db/schema";
import { formatPrice, formatDate } from "@/lib/utils";
import Link from "next/link";

interface ListingCardProps {
  listing: Listing;
  isSelected?: boolean;
  isNew?: boolean;
  onHover?: (id: string | null) => void;
}

export default function ListingCard({
  listing,
  isSelected,
  isNew,
  onHover,
}: ListingCardProps) {
  return (
    <Link
      href={`/listing/${listing.id}`}
      className={`block p-4 border rounded-lg transition-all hover:shadow-lg ${
        isSelected ? "ring-2 ring-blue-500 bg-blue-50" : "bg-white"
      } ${
        isNew ? "border-green-500 border-2 animate-pulse" : "border-gray-200"
      }`}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
      role="article"
      aria-label={`Property listing: ${listing.address}`}
    >
      {isNew && (
        <span className="inline-block mb-2 px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded">
          NEW
        </span>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {listing.address}
      </h3>
      <p className="text-2xl font-bold text-blue-600 mb-2">
        {formatPrice(listing.price)}
      </p>
      <div className="flex gap-4 text-sm text-gray-600 mb-2">
        <span>{listing.beds} bed</span>
        <span>•</span>
        <span>{listing.baths} bath</span>
        <span>•</span>
        <span className="capitalize">{listing.status.replace("_", " ")}</span>
      </div>
      <div className="text-sm text-gray-500">
        <span>{listing.city}</span>
        <span className="mx-2">•</span>
        <span>Updated {formatDate(listing.updatedAt)}</span>
      </div>
    </Link>
  );
}
