import "reflect-metadata";
import type { NextRequest } from "next/server";
import { container } from "tsyringe";
import { EventService } from "~/core/features/events/service";
import * as E from "fp-ts/lib/Either";
import { addConnection, removeConnection } from "./connections";

export interface SSEMessage {
  type: "connected" | "refresh";
  data?: {
    refreshTypes: Array<
      "presenter-state" | "questions" | "activities" | "activity-responses"
    >;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> },
) {
  try {
    const { shortId } = await params;
    // SSE connection request for shortId: ${shortId}

    const eventService = container.resolve<EventService>(EventService);

    const eventResult = await eventService.getByShortId(shortId)();

    if (E.isLeft(eventResult)) {
      // Event not found for shortId: ${shortId}
      return new Response("Event not found", { status: 404 });
    }

    // SSE connection established for shortId ${shortId}

    const stream = new ReadableStream({
      start(controller) {
        addConnection(shortId, controller);

        const encoder = new TextEncoder();
        const connectedMessage: SSEMessage = { type: "connected" };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(connectedMessage)}\n\n`),
        );

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          } catch {
            // Heartbeat failed for shortId ${shortId}
            clearInterval(heartbeat);
            // Add small delay before removing connection to allow any pending broadcasts
            setTimeout(() => {
              removeConnection(shortId, controller);
            }, 1000);
          }
        }, 30000);

        return () => {
          // Connection cleanup requested for shortId ${shortId}
          clearInterval(heartbeat);
          // Add small delay before removing connection to allow any pending broadcasts
          setTimeout(() => {
            removeConnection(shortId, controller);
          }, 1000);
        };
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Cache-Control",
        "X-Accel-Buffering": "no", // Disable nginx buffering
        "Content-Encoding": "identity", // Prevent compression
      },
    });
  } catch (error) {
    console.error("Error in SSE route:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
