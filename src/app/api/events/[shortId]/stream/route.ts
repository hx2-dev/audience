import "reflect-metadata";
import type { NextRequest } from "next/server";
import { container } from "tsyringe";
import { EventService } from "~/core/features/events/service";
import * as E from "fp-ts/lib/Either";

export interface SSEMessage {
  type: "connected" | "refresh";
  data?: {
    refreshTypes: Array<
      "presenter-state" | "questions" | "activities" | "activity-responses"
    >;
  };
}

const connections = new Map<string, Set<ReadableStreamDefaultController>>();

function addConnection(
  shortId: string,
  controller: ReadableStreamDefaultController,
) {
  if (!connections.has(shortId)) {
    connections.set(shortId, new Set());
  }
  connections.get(shortId)!.add(controller);
  // Connection added for shortId ${shortId}
}

function removeConnection(
  shortId: string,
  controller: ReadableStreamDefaultController,
) {
  const eventConnections = connections.get(shortId);
  if (eventConnections) {
    const wasRemoved = eventConnections.delete(controller);
    if (wasRemoved) {
      // Connection removed for shortId ${shortId}
    }
    if (eventConnections.size === 0) {
      connections.delete(shortId);
      // All connections closed for shortId ${shortId}
    }
  }
}

export function broadcastToEvent(
  shortId: string,
  refreshTypes: Array<
    "presenter-state" | "questions" | "activities" | "activity-responses"
  > = ["presenter-state"],
) {
  // Broadcasting to shortId: ${shortId}, types: [${refreshTypes.join(', ')}]

  const eventConnections = connections.get(shortId);
  if (eventConnections && eventConnections.size > 0) {
    const sseMessage: SSEMessage = {
      type: "refresh",
      data: { refreshTypes },
    };
    const message = `data: ${JSON.stringify(sseMessage)}\n\n`;
    // Sending message to ${eventConnections.size} connections
    const deadConnections: ReadableStreamDefaultController[] = [];

    eventConnections.forEach((controller) => {
      try {
        controller.enqueue(new TextEncoder().encode(message));
      } catch {
        // Dead connection detected
        deadConnections.push(controller);
      }
    });

    // Clean up dead connections
    deadConnections.forEach((controller) => {
      eventConnections.delete(controller);
    });

    if (deadConnections.length > 0) {
      // Cleaned up ${deadConnections.length} dead connections
    }
  } else {
    // No connections found for shortId ${shortId}
  }
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
            }, 100);
          }
        }, 30000);

        return () => {
          // Connection cleanup requested for shortId ${shortId}
          clearInterval(heartbeat);
          // Add small delay before removing connection to allow any pending broadcasts
          setTimeout(() => {
            removeConnection(shortId, controller);
          }, 100);
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
