import { NextRequest } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection
      controller.enqueue(encoder.encode(": connected\n\n"));

      let intervalId: NodeJS.Timeout;
      let heartbeatId: NodeJS.Timeout;

      // Simulate new listings every 8-15 seconds
      const emitListing = () => {
        try {
          const allListings = db.all(sql.raw("SELECT * FROM listing")) as any[];

          if (allListings.length > 0) {
            // Pick a random listing and modify it slightly
            const randomListing =
              allListings[Math.floor(Math.random() * allListings.length)];
            const modifiedListing = {
              ...randomListing,
              id: `${randomListing.id}-new-${Date.now()}`,
              price:
                randomListing.price +
                Math.floor(Math.random() * 100000 - 50000),
              updated_at: new Date().toISOString(),
            };

            const message = `data: ${JSON.stringify(modifiedListing)}\n\n`;
            controller.enqueue(encoder.encode(message));
          }
        } catch (error) {
          console.error("Error emitting listing:", error);
        }
      };

      // Heartbeat every 15 seconds
      const sendHeartbeat = () => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch (error) {
          console.error("Error sending heartbeat:", error);
        }
      };

      // Start intervals
      intervalId = setInterval(emitListing, Math.random() * 7000 + 8000);
      heartbeatId = setInterval(sendHeartbeat, 15000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        clearInterval(heartbeatId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
