import type { SSEMessage } from "./route";

// Also import the poll broadcast function
let broadcastToPollClients:
  | ((
      shortId: string,
      refreshTypes: Array<
        "presenter-state" | "questions" | "activities" | "activity-responses"
      >,
    ) => void)
  | null = null;

// Dynamically import to avoid circular dependency
async function getBroadcastToPollClients() {
  if (!broadcastToPollClients) {
    const pollModule = await import("../poll/route");
    broadcastToPollClients = pollModule.broadcastToPollClients;
  }
  return broadcastToPollClients;
}

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

export async function getConnectionCount(shortId: string): Promise<number> {
  const eventConnections = connections.get(shortId);
  const sseCount = eventConnections ? eventConnections.size : 0;
  
  // Get polling connection count
  let pollingCount = 0;
  try {
    const pollModule = await import("../poll/route");
    pollingCount = pollModule.getPollingConnectionCount(shortId);
  } catch (error) {
    console.error("Error getting polling connection count:", error);
  }
  
  return sseCount + pollingCount;
}

export async function broadcastToEvent(
  shortId: string,
  refreshTypes: Array<
    "presenter-state" | "questions" | "activities" | "activity-responses"
  > = ["presenter-state"],
) {
  // Broadcasting to shortId: ${shortId}, types: [${refreshTypes.join(', ')}]

  // Broadcast to SSE connections
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
    // No SSE connections found for shortId ${shortId}
  }

  // Also broadcast to polling clients
  try {
    const pollBroadcast = await getBroadcastToPollClients();
    pollBroadcast(shortId, refreshTypes);
  } catch (error) {
    console.error("Error broadcasting to poll clients:", error);
  }
}
