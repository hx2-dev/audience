import type { SSEMessage } from "./route";

const connections = new Map<string, Set<ReadableStreamDefaultController>>();

export function addConnection(
  shortId: string,
  controller: ReadableStreamDefaultController,
) {
  if (!connections.has(shortId)) {
    connections.set(shortId, new Set());
  }
  const eventConnections = connections.get(shortId);
  if (eventConnections) {
    eventConnections.add(controller);
  }
  // Connection added for shortId ${shortId}
}

export function removeConnection(
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
