"use client";

import { useEffect, useState } from "react";
import { Listing } from "@/db/schema";
import ListingCard from "./ListingCard";

interface RealtimeListingsProps {
  initialListings: Listing[];
  onHover?: (id: string | null) => void;
  selectedId?: string;
}

export default function RealtimeListings({
  initialListings,
  onHover,
  selectedId,
}: RealtimeListingsProps) {
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [newListings, setNewListings] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "error"
  >("connecting");

  useEffect(() => {
    setListings(initialListings);
    setNewListings(new Set());
  }, [initialListings]);

  useEffect(() => {
    const eventSource = new EventSource("/api/stream/listings");

    eventSource.onopen = () => {
      setConnectionStatus("connected");
    };

    eventSource.onmessage = (event) => {
      if (event.data) {
        try {
          const newListing: Listing = JSON.parse(event.data);
          setListings((prev) => [newListing, ...prev]);
          setNewListings((prev) => new Set(prev).add(newListing.id));

          // Remove "new" badge after 10 seconds
          setTimeout(() => {
            setNewListings((prev) => {
              const next = new Set(prev);
              next.delete(newListing.id);
              return next;
            });
          }, 10000);
        } catch (error) {
          console.error("Error parsing SSE data:", error);
        }
      }
    };

    eventSource.onerror = () => {
      setConnectionStatus("error");
      eventSource.close();

      // Attempt reconnection after 5 seconds
      setTimeout(() => {
        setConnectionStatus("connecting");
      }, 5000);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray">
          {listings.length} Properties Found
        </h2>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionStatus === "connected"
                ? "bg-green-500"
                : connectionStatus === "connecting"
                ? "bg-yellow-500 animate-pulse"
                : "bg-red-500"
            }`}
            aria-label={`Connection status: ${connectionStatus}`}
          />
          <span className="text-sm text-gray-600 capitalize">
            {connectionStatus}
          </span>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg mb-2">No properties found</p>
          <p className="text-gray-500 text-sm">
            Try adjusting your filters to see more results
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isSelected={listing.id === selectedId}
              isNew={newListings.has(listing.id)}
              onHover={onHover}
            />
          ))}
        </div>
      )}
    </div>
  );
}
