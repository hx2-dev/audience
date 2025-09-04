import "reflect-metadata";
import type { NextRequest } from "next/server";
import { container } from "tsyringe";
import { EventService } from "~/core/features/events/service";
import * as E from "fp-ts/lib/Either";

const connections = new Map<string, Set<ReadableStreamDefaultController>>();

function addConnection(
  eventId: string,
  controller: ReadableStreamDefaultController,
) {
  if (!connections.has(eventId)) {
    connections.set(eventId, new Set());
  }
  connections.get(eventId)!.add(controller);
  console.log(`Added connection for event ${eventId}. Total connections: ${connections.get(eventId)!.size}`);
}

function removeConnection(
  eventId: string,
  controller: ReadableStreamDefaultController,
) {
  const eventConnections = connections.get(eventId);
  if (eventConnections) {
    const wasRemoved = eventConnections.delete(controller);
    if (wasRemoved) {
      console.log(`Removed connection for event ${eventId}. Remaining connections: ${eventConnections.size}`);
    }
    if (eventConnections.size === 0) {
      connections.delete(eventId);
      console.log(`No more connections for event ${eventId}. Cleaned up event.`);
    }
  }
}

export function broadcastToEvent(eventId: string) {
  console.log(`broadcastToEvent called with eventId: ${eventId} (type: ${typeof eventId})`);
  console.log(`Current connections map keys:`, Array.from(connections.keys()));
  
  const eventConnections = connections.get(eventId);
  if (eventConnections && eventConnections.size > 0) {
    const message = `data: {"type":"refresh"}\n\n`;
    console.log(`Broadcasting to ${eventConnections.size} connections for event ${eventId}`);
    const deadConnections: ReadableStreamDefaultController[] = [];
    
    eventConnections.forEach((controller) => {
      try {
        controller.enqueue(new TextEncoder().encode(message));
      } catch (error) {
        console.log(`Dead connection detected for event ${eventId}:`, error);
        deadConnections.push(controller);
      }
    });
    
    // Clean up dead connections
    deadConnections.forEach(controller => {
      eventConnections.delete(controller);
    });
    
    if (deadConnections.length > 0) {
      console.log(`Cleaned up ${deadConnections.length} dead connections for event ${eventId}`);
    }
  } else {
    console.log(`No connections found for event ${eventId}. Available events: [${Array.from(connections.keys()).join(', ')}]`);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> },
) {
  try {
    const { shortId } = await params;
    console.log(`SSE connection request for shortId: ${shortId}`);

    const eventService = container.resolve<EventService>(EventService);

    const eventResult = await eventService.getByShortId(shortId)();

    if (E.isLeft(eventResult)) {
      console.error(`Event not found for shortId: ${shortId}`);
      return new Response("Event not found", { status: 404 });
    }

    const event = eventResult.right;
    const eventId = event.id.toString();
    console.log(`SSE connection established for event ${eventId} (${shortId})`);

    const stream = new ReadableStream({
      start(controller) {
        addConnection(eventId, controller);

        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          } catch (error) {
            console.log(`Heartbeat failed for event ${eventId}:`, error);
            clearInterval(heartbeat);
            // Add small delay before removing connection to allow any pending broadcasts
            setTimeout(() => {
              removeConnection(eventId, controller);
            }, 100);
          }
        }, 30000);

        return () => {
          console.log(`Connection cleanup requested for event ${eventId}`);
          clearInterval(heartbeat);
          // Add small delay before removing connection to allow any pending broadcasts
          setTimeout(() => {
            removeConnection(eventId, controller);
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
