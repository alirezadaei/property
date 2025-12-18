"use client";

import { useState } from "react";
import SearchFilters from "@/components/SearchFilters";
import RealtimeListings from "@/components/RealtimeListings";
import { Listing } from "@/db/schema";

export default function SearchPageClient({
  listings,
}: {
  listings: Listing[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeId = hoveredId || selectedId;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters - Left sidebar on desktop, top on mobile */}
        <div className="lg:col-span-1">
          <SearchFilters />
        </div>

        {/* Main content - Listings and Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Listings */}
          <RealtimeListings
            initialListings={listings}
            selectedId={activeId || undefined}
            onHover={(id) => setHoveredId(id)}
          />
        </div>
      </div>
    </div>
  );
}
